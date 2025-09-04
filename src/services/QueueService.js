const { QueueManager } = require('../queue/QueueManager');

class QueueService {
  constructor() {
    this.queueManager = new QueueManager({
      persistDir: process.env.QUEUE_PERSIST_DIR || './storage/queues',
      maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY) || 1000
    });
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    await this.queueManager.initialize();
    this.initialized = true;
    
    console.log('✅ QueueService initialized');
  }

  async enqueueTask(queueName, taskData) {
    if (!this.initialized) await this.initialize();
    
    this.validateTaskData(taskData);
    
    const queue = await this.queueManager.createQueue(queueName);
    const taskId = await queue.enqueue(taskData);
    
    return {
      success: true,
      taskId,
      queueName,
      message: 'Task enqueued successfully'
    };
  }

  async saveRecord(queueName, model, data, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'create',
      data,
      options
    });
  }

  async updateRecord(queueName, model, id, data, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'update',
      data: { id, updateData: data },
      options
    });
  }

  async deleteRecord(queueName, model, id, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'delete',
      data: { id },
      options
    });
  }

  async bulkSave(queueName, model, records, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'bulkcreate',
      data: { records },
      options
    });
  }

  async bulkUpdate(queueName, model, where, updateData, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'bulkupdate',
      data: { where, updateData },
      options
    });
  }

  async bulkDelete(queueName, model, where, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'bulkdelete',
      data: { where },
      options
    });
  }

  async customOperation(queueName, model, method, params, options = {}) {
    return await this.enqueueTask(queueName, {
      type: 'database',
      model,
      operation: 'custom',
      data: { method, params },
      options
    });
  }

  async createQueue(queueName, options = {}) {
    if (!this.initialized) await this.initialize();
    
    const queue = await this.queueManager.createQueue(queueName, options);
    return {
      success: true,
      queueName,
      message: 'Queue created successfully'
    };
  }

  async deleteQueue(queueName) {
    if (!this.initialized) await this.initialize();
    
    await this.queueManager.deleteQueue(queueName);
    return {
      success: true,
      queueName,
      message: 'Queue deleted successfully'
    };
  }

  async createWorker(queueName, threadCount = 1, options = {}) {
    if (!this.initialized) await this.initialize();
    
    const { workerId, worker } = await this.queueManager.createWorker(queueName, threadCount, options);
    return {
      success: true,
      workerId,
      queueName,
      threadCount,
      message: 'Worker created successfully'
    };
  }

  async stopWorker(workerId) {
    if (!this.initialized) await this.initialize();
    
    await this.queueManager.stopWorker(workerId);
    return {
      success: true,
      workerId,
      message: 'Worker stopped successfully'
    };
  }

  async getTaskStatus(queueName, taskId) {
    if (!this.initialized) await this.initialize();
    
    const queue = await this.queueManager.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const task = await queue.getTask(taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found in queue '${queueName}'`);
    }

    return {
      success: true,
      task: {
        id: task.id,
        status: task.status,
        model: task.model,
        operation: task.operation,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        result: task.result,
        error: task.error,
        retryCount: task.retryCount
      }
    };
  }

  async getQueueStats(queueName) {
    if (!this.initialized) await this.initialize();
    
    const stats = await this.queueManager.getQueueStats(queueName);
    if (!stats) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return {
      success: true,
      stats
    };
  }

  async getAllQueuesStats() {
    if (!this.initialized) await this.initialize();
    
    const stats = await this.queueManager.getAllQueuesStats();
    return {
      success: true,
      stats
    };
  }

  
async getQueueTasks(queueName, options = {}) {
  if (!this.initialized) await this.initialize();
  
  const queue = await this.queueManager.getQueue(queueName);
  if (!queue) {
    throw new Error(`Queue '${queueName}' not found`);
  }

  const { status, limit = 50, offset = 0 } = options;
  
  // SOLUCIÓN SIMPLE: Limitar procesamiento y evitar memory leak
  const tasks = [];
  let processed = 0;
  const maxProcess = 100; // Procesar máximo 100 tareas
  const maxReturn = Math.min(limit, 50); // Devolver máximo 50
  
  // Convertir Map a Array de forma segura
  const taskArray = Array.from(queue.taskHistory.entries()).slice(0, maxProcess);
  
  for (const [taskId, task] of taskArray) {
    // Filtrar por status si se especifica
    if (status && task.status !== status) continue;
    
    // Aplicar offset
    if (processed < offset) {
      processed++;
      continue;
    }
    
    // Aplicar limit
    if (tasks.length >= maxReturn) break;
    
    tasks.push({
      id: task.id,
      status: task.status,
      model: task.model,
      operation: task.operation,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error,
      retryCount: task.retryCount
    });
    
    processed++;
  }

  return {
    success: true,
    tasks,
    pagination: {
      limit: maxReturn,
      offset,
      returned: tasks.length,
      total: Math.min(queue.taskHistory.size, maxProcess)
    }
  };
}
  validateTaskData(taskData) {
    const { type, model, operation, data } = taskData;
    
    if (!type) throw new Error('Task type is required');
    if (!model) throw new Error('Model name is required');
    if (!operation) throw new Error('Operation is required');
    if (!data) throw new Error('Task data is required');

    const validOperations = ['create', 'update', 'delete', 'bulkcreate', 'bulkupdate', 'bulkdelete', 'custom'];
    if (!validOperations.includes(operation.toLowerCase())) {
      throw new Error(`Invalid operation: ${operation}. Valid operations: ${validOperations.join(', ')}`);
    }
  }

  async shutdown() {
    if (!this.initialized) return;
    
    await this.queueManager.shutdown();
    this.initialized = false;
    console.log('✅ QueueService shutdown complete');
  }

  onTaskCompleted(queueName, callback) {
    this.queueManager.on(`${queueName}:task:completed`, callback);
  }

  onTaskFailed(queueName, callback) {
    this.queueManager.on(`${queueName}:task:failed`, callback);
  }

  onTaskError(queueName, callback) {
    this.queueManager.on(`${queueName}:task:error`, callback);
  }
}

module.exports = QueueService;