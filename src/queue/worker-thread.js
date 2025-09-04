const { parentPort, threadId } = require('worker_threads');
const TaskProcessor = require('./TaskProcessor');

let processor = null;

parentPort.on('message', async (message) => {
  const { type, task } = message;
  
  if (type === 'process') {
    try {
      if (!processor) {
        processor = new TaskProcessor();
        await processor.initialize();
      }
      
      const result = await processor.processTask(task);
      
      parentPort.postMessage({
        type: 'task:completed',
        taskId: task.id,
        result,
        threadId
      });
      
    } catch (error) {
      const shouldRetry = error.retry !== false && task.retryCount < 3;
      
      parentPort.postMessage({
        type: shouldRetry ? 'task:failed' : 'task:error',
        taskId: task.id,
        error: error.message,
        threadId
      });
    }
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in worker thread:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in worker thread:', reason);
  process.exit(1);
});
