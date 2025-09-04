const fs = require("fs").promises;
const path = require("path");
const EventEmitter = require("events");

const { Worker } = require("worker_threads");

class Task {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.model = data.model;
    this.operation = data.operation;
    this.data = data.data;
    this.options = data.options || {};
    this.queueName = data.queueName;
    this.status = data.status || "pending";
    this.createdAt = data.createdAt || new Date();
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.result = data.result;
    this.error = data.error;
    this.retryCount = data.retryCount || 0;
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      model: this.model,
      operation: this.operation,
      data: this.data,
      options: this.options,
      queueName: this.queueName,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      result: this.result,
      error: this.error,
      retryCount: this.retryCount,
    };
  }

  static deserialize(data) {
    return new Task({
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      startedAt: data.startedAt ? new Date(data.startedAt) : null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
    });
  }
}

//cola
class Queue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.tasks = [];
    this.taskHistory = new Map();
    this.processing = false;
    this.persistDir = options.persistDir;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.persistFile = path.join(this.persistDir, `${name}.json`);
  }

  async initialize() {
    console.log(`🔍 [Queue] Initializing queue: ${this.name}`);

    try {
      console.log(`🔍 [Queue] About to load from disk: ${this.persistFile}`);

      const loadPromise = this.loadFromDisk();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("loadFromDisk timeout")), 3000);
      });

      await Promise.race([loadPromise, timeoutPromise]);
      console.log(`✅ [Queue] Queue ${this.name} initialized successfully`);
    } catch (error) {
      console.error(`❌ [Queue] Error initializing queue ${this.name}:`, error);
      throw error;
    }
  }

  async enqueue(taskData) {
    const task = new Task({
      id: this.generateTaskId(),
      type: taskData.type,
      model: taskData.model,
      operation: taskData.operation,
      data: taskData.data,
      options: taskData.options || {},
      queueName: this.name,
      createdAt: new Date(),
      status: "pending",
    });

    this.tasks.push(task);
    this.taskHistory.set(task.id, task);

    await this.saveToDisk();
    this.emit("task:enqueued", task);

    console.log(`📥 Task ${task.id} enqueued in ${this.name}`);
    return task.id;
  }

  async dequeue() {
    if (this.tasks.length === 0) return null;

    const task = this.tasks.shift();
    task.status = "processing";
    task.startedAt = new Date();

    await this.saveToDisk();
    this.emit("task:dequeued", task);

    return task;
  }

  async getTask(taskId) {
    return this.taskHistory.get(taskId);
  }

  async updateTaskStatus(taskId, status, result = null, error = null) {
    const task = this.taskHistory.get(taskId);
    if (!task) return false;

    task.status = status;
    task.completedAt = new Date();

    if (result) task.result = result;
    if (error) {
      task.error = error;
      task.retryCount = (task.retryCount || 0) + 1;
    }

    await this.saveToDisk();
    this.emit("task:updated", task);

    return true;
  }

  async requeueTask(taskId) {
    const task = this.taskHistory.get(taskId);
    if (!task) return false;

    if (task.retryCount >= this.maxRetries) {
      task.status = "failed";
      await this.saveToDisk();
      return false;
    }

    task.status = "pending";
    task.retryCount = (task.retryCount || 0) + 1;
    this.tasks.push(task);

    await this.saveToDisk();
    this.emit("task:requeued", task);

    return true;
  }

  async getStats() {
    console.log(`🔍 [Queue] Getting stats for queue: ${this.name}`);

    try {
      const stats = {
        name: this.name,
        total: this.taskHistory ? this.taskHistory.size : 0,
        pending: this.tasks ? this.tasks.length : 0,
        processing: 0,
        completed: 0,
        failed: 0,
        error: 0,
      };

      console.log(`🔍 [Queue] Initial stats:`, stats);

      if (this.taskHistory && this.taskHistory.size > 0) {
        console.log(`🔍 [Queue] Processing task history...`);
        for (const task of this.taskHistory.values()) {
          if (task && task.status && stats.hasOwnProperty(task.status)) {
            stats[task.status]++;
          }
        }
        console.log(`✅ [Queue] Final stats:`, stats);
      }

      return stats;
    } catch (error) {
      console.error(`❌ [Queue] Error generating stats:`, error);
      throw error;
    }
  }

  generateTaskId() {
    return `${this.name}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  async saveToDisk() {
    try {
      const data = {
        name: this.name,
        tasks: this.tasks.map((task) => task.serialize()),
        taskHistory: Array.from(this.taskHistory.entries()).map(
          ([id, task]) => [id, task.serialize()]
        ),
      };

      await fs.writeFile(this.persistFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving queue ${this.name}:`, error);
    }
  }

  async loadFromDisk() {
    console.log(`🔍 [Queue] Loading from disk: ${this.persistFile}`);

    try {
      console.log(`🔍 [Queue] Reading file...`);

      // Timeout para la lectura del archivo
      const readPromise = fs.readFile(this.persistFile, "utf8");
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("File read timeout")), 2000);
      });

      const data = await Promise.race([readPromise, timeoutPromise]);
      console.log(
        `✅ [Queue] File read successfully, size: ${data.length} chars`
      );

      console.log(`🔍 [Queue] Parsing JSON...`);
      const parsed = JSON.parse(data);

      console.log(`🔍 [Queue] Deserializing tasks...`);
      this.tasks = parsed.tasks.map((taskData) => Task.deserialize(taskData));
      console.log(`✅ [Queue] Tasks deserialized: ${this.tasks.length}`);

      console.log(`🔍 [Queue] Deserializing task history...`);
      this.taskHistory = new Map(
        parsed.taskHistory.map(([id, taskData]) => [
          id,
          Task.deserialize(taskData),
        ])
      );
      console.log(
        `✅ [Queue] Task history deserialized: ${this.taskHistory.size}`
      );

      console.log(
        `✅ [Queue] Loaded queue ${this.name} with ${this.tasks.length} pending tasks`
      );
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`❌ [Queue] Error loading queue ${this.name}:`, error);
        throw error;
      } else {
        console.log(
          `ℹ️ [Queue] No existing file for queue ${this.name} (first run)`
        );
      }
    }
  }

  async destroy() {
    await this.saveToDisk();
    this.removeAllListeners();
  }
}

class QueueWorker extends EventEmitter {
  constructor(id, queue, threadCount = 1, options = {}) {
    super();
    this.id = id;
    this.queue = queue;
    this.threadCount = threadCount;
    this.workers = [];
    this.isRunning = false;
    this.processingTasks = new Set();
    this.options = options;
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;

    for (let i = 0; i < this.threadCount; i++) {
      const worker = new Worker(path.join(__dirname, "worker-thread.js"));

      worker.on("message", async (message) => {
        await this.handleWorkerMessage(message);
      });

      worker.on("error", (error) => {
        console.error(`Worker thread error:`, error);
        this.emit("worker:error", error);
      });

      this.workers.push(worker);
    }

    // Start processing loop
    this.processLoop();

    console.log(
      `🏃 QueueWorker ${this.id} started with ${this.threadCount} threads`
    );
  }

  async stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Wait for current tasks to complete
    while (this.processingTasks.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Terminate all worker threads
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];

    console.log(`🛑 QueueWorker ${this.id} stopped`);
  }

  async processLoop() {
    while (this.isRunning) {
      try {
        if (this.processingTasks.size < this.threadCount) {
          const task = await this.queue.dequeue();

          if (task) {
            await this.processTask(task);
          } else {
            // No tasks available, wait a bit
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          // All threads busy, wait a bit
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error("Error in process loop:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  async processTask(task) {
    const availableWorker = this.workers.find(
      (w) => !this.processingTasks.has(w.threadId)
    );
    if (!availableWorker) {
      // No available worker, put task back
      this.queue.tasks.unshift(task);
      return;
    }

    this.processingTasks.add(availableWorker.threadId);

    try {
      availableWorker.postMessage({
        type: "process",
        task: task.serialize(),
      });
    } catch (error) {
      this.processingTasks.delete(availableWorker.threadId);
      await this.queue.updateTaskStatus(task.id, "error", null, error.message);
    }
  }

  async handleWorkerMessage(message) {
    const { type, taskId, result, error, threadId } = message;

    if (threadId) {
      this.processingTasks.delete(threadId);
    }

    switch (type) {
      case "task:completed":
        await this.queue.updateTaskStatus(taskId, "completed", result);
        this.emit("task:completed", { taskId, result });
        break;

      case "task:failed":
        const shouldRetry = await this.queue.requeueTask(taskId);
        if (!shouldRetry) {
          await this.queue.updateTaskStatus(taskId, "failed", null, error);
        }
        this.emit("task:failed", { taskId, error, retry: shouldRetry });
        break;

      case "task:error":
        await this.queue.updateTaskStatus(taskId, "error", null, error);
        this.emit("task:error", { taskId, error });
        break;
    }
  }
}

class QueueManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = new Map();
    this.workers = new Map();
    this.persistDir =
      options.persistDir || path.join(__dirname, "../storage/queues");
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log("✅ QueueManager - Starting initialization");

    try {
      // Paso 1: Crear directorio
      await fs.mkdir(this.persistDir, { recursive: true });
      console.log("✅ QueueManager - Persist directory ready");

      // Paso 2: Cargar colas existentes SIN recursión
      await this.loadPersistedQueuesFixed();
      console.log("✅ QueueManager - Persisted queues loaded");

      this.initialized = true;
      console.log("✅ QueueManager initialized");
    } catch (error) {
      console.error("❌ Error initializing QueueManager:", error);
      throw error;
    }
  }

  async loadPersistedQueuesFixed() {
    try {
      const files = await fs.readdir(this.persistDir);
      const queueFiles = files.filter((file) => file.endsWith(".json"));

      console.log(`📁 Found ${queueFiles.length} queue files to load`);

      for (const file of queueFiles) {
        const queueName = file.replace(".json", "");

        // IMPORTANTE: No usar this.createQueue() porque causa recursión
        // En su lugar, crear la cola manualmente
        if (!this.queues.has(queueName)) {
          console.log(`📥 Loading queue: ${queueName}`);

          const queue = new Queue(queueName, {
            persistDir: this.persistDir,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay,
          });

          // Inicializar la cola individual
          await queue.initialize();

          // Agregar al mapa de colas
          this.queues.set(queueName, queue);

          console.log(`✅ Queue '${queueName}' loaded successfully`);
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Error loading persisted queues:", error);
        throw error;
      }
      console.log("📂 No existing queues directory (first run)");
    }
  }

  async createQueue(queueName, options = {}) {
    if (!this.initialized) {
      // Solo inicializar si no está inicializado
      await this.initialize();
    }

    if (this.queues.has(queueName)) {
      console.log(`📋 Queue '${queueName}' already exists`);
      return this.queues.get(queueName);
    }

    const queue = new Queue(queueName, {
      ...options,
      persistDir: this.persistDir,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
    });

    // IMPORTANTE: NO llamar a queue.initialize() aquí si ya estamos en proceso de carga
    // Solo inicializar si es una cola completamente nueva
    const persistFile = path.join(this.persistDir, `${queueName}.json`);
    try {
      await fs.access(persistFile);
      // El archivo existe, inicializar normalmente
      await queue.initialize();
    } catch {
      // El archivo no existe, es una cola nueva
      console.log(`📝 Creating new queue: ${queueName}`);
      // No necesita cargar desde disco
    }

    this.queues.set(queueName, queue);

    console.log(`✅ Queue '${queueName}' created`);
    return queue;
  }

  async getQueue(queueName) {
    return this.queues.get(queueName);
  }

  async deleteQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.destroy();
      this.queues.delete(queueName);
      // Stop all workers for this queue
      const workersForQueue = Array.from(this.workers.entries()).filter(
        ([_, worker]) => worker.queueName === queueName
      );

      for (const [workerId, worker] of workersForQueue) {
        await worker.stop();
        this.workers.delete(workerId);
      }
      console.log(`✅ Queue '${queueName}' deleted`);
    }
  }

  async createWorker(queueName, threadCount = 1, options = {}) {
    const queue = await this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const workerId = `${queueName}_worker_${Date.now()}`;
    const worker = new QueueWorker(workerId, queue, threadCount, options);

    this.workers.set(workerId, worker);
    await worker.start();

    console.log(`✅ Worker '${workerId}' created with ${threadCount} threads`);
    return { workerId, worker };
  }

  async stopWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (worker) {
      await worker.stop();
      this.workers.delete(workerId);
      console.log(`✅ Worker '${workerId}' stopped`);
    }
  }

  async getQueueStats(queueName) {
    console.log(`🔍 [QueueManager] Getting stats for queue: ${queueName}`);

    // Verificar si el queueName existe
    if (!queueName || typeof queueName !== "string") {
      console.error(`❌ [QueueManager] Invalid queueName:`, queueName);
      return null;
    }

    console.log(
      `🔍 [QueueManager] Available queues:`,
      Array.from(this.queues.keys())
    );

    const queue = await this.getQueue(queueName);
    console.log(`🔍 [QueueManager] Queue found:`, !!queue);

    if (!queue) {
      console.log(`❌ [QueueManager] Queue '${queueName}' not found`);
      return null;
    }

    try {
      console.log(`🔄 [QueueManager] Calling queue.getStats()...`);
      const stats = await queue.getStats();
      console.log(`✅ [QueueManager] Stats obtained:`, stats);
      return stats;
    } catch (error) {
      console.error(`❌ [QueueManager] Error in queue.getStats():`, error);
      throw error;
    }
  }

  async getAllQueuesStats() {
    const stats = {};
    for (const [name, queue] of this.queues) {
      stats[name] = await queue.getStats();
    }
    return stats;
  }

  async loadPersistedQueues() {
    console.log("🔍 [QueueManager] Starting to load persisted queues...");

    try {
      console.log("🔍 [QueueManager] Reading directory:", this.persistDir);

      // Agregar timeout aquí también
      const readDirPromise = fs.readdir(this.persistDir);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("readdir timeout")), 2000);
      });

      const files = await Promise.race([readDirPromise, timeoutPromise]);
      console.log(
        "✅ [QueueManager] Directory read, files found:",
        files.length
      );

      const queueFiles = files.filter((file) => file.endsWith(".json"));
      console.log("🔍 [QueueManager] Queue files found:", queueFiles);

      for (const file of queueFiles) {
        console.log(`🔍 [QueueManager] Loading queue file: ${file}`);
        const queueName = file.replace(".json", "");

        // Este puede ser el problema - createQueue puede colgarse
        const createPromise = this.createQueue(queueName);
        const createTimeout = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error(`createQueue timeout for ${queueName}`)),
            2000
          );
        });

        await Promise.race([createPromise, createTimeout]);
        console.log(`✅ [QueueManager] Queue loaded: ${queueName}`);
      }

      console.log("✅ [QueueManager] All persisted queues loaded successfully");
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "❌ [QueueManager] Error loading persisted queues:",
          error
        );
        throw error;
      } else {
        console.log(
          "ℹ️ [QueueManager] No existing queue directory found (first run)"
        );
      }
    }
  }

  async shutdown() {
    console.log("🔄 Shutting down QueueManager...");

    // Stop all workers
    const workerPromises = Array.from(this.workers.values()).map((worker) =>
      worker.stop()
    );
    await Promise.all(workerPromises);

    // Save and close all queues
    const queuePromises = Array.from(this.queues.values()).map((queue) =>
      queue.destroy()
    );
    await Promise.all(queuePromises);

    this.queues.clear();
    this.workers.clear();

    console.log("✅ QueueManager shutdown complete");
  }
}

module.exports = {
  QueueManager,
  Queue,
  Task,
  QueueWorker,
};
