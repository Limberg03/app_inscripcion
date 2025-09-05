const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const queueValidators = require('../validators/queueValidators');

router.get('/health', queueController.healthCheck);


router.get('/debug/simple/:queueName', queueController.debugSimpleStats);

router.post('/queues/:queueName', queueController.createQueue);
router.delete('/queues/:queueName', queueController.deleteQueue);
router.get('/queues/:queueName/stats', queueController.getQueueStats);
router.get('/queues/:queueName/tasks', queueController.getQueueTasks);
router.get('/queues/stats/all', queueController.getAllQueuesStats);

router.post('/queues/:queueName/tasks', 
  queueValidators.enqueueTask, 
  queueController.enqueueTask
);

router.get('/queues/:queueName/tasks/:taskId', 
  queueValidators.taskId,
  queueController.getTaskStatus
);

router.post('/queues/:queueName/:model/save', 
  queueValidators.saveRecord,
  queueController.saveRecord
);

router.put('/queues/:queueName/:model/:id', 
  queueValidators.updateRecord,
  queueController.updateRecord
);

router.delete('/queues/:queueName/:model/:id', 
  queueValidators.idParam,
  queueController.deleteRecord
);

router.post('/queues/:queueName/:model/bulk-save', 
  queueValidators.bulkSave,
  queueController.bulkSave
);

router.post('/queues/:queueName/workers', 
  queueValidators.createWorker,
  queueController.createWorker
);

router.delete('/workers/:workerId', 
  queueValidators.workerId,
  queueController.stopWorker
);


module.exports = router;
