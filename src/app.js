// app.js - VERSIÓN CON REDIS PARA SISTEMA DE COLAS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importaciones de modelos y middlewares
const { sequelize } = require('./models/index');
const routes = require('./routes/index');
const { notFound, errorHandler, requestLogger } = require('./middleware/index');

// Importaciones del sistema de colas con Redis
const queueRoutes = require('./routes/queueRoutes');
const QueueService = require('./services/QueueService'); // Ahora usa Redis
const CallbackService = require('./services/CallbackService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// ================ CONFIGURACIÓN DE RUTAS ================
app.use('/', routes);
app.use('/queue', queueRoutes);

// Ruta raíz con información completa del sistema
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema Académico con Redis Queue System',
    version: '3.0.0',
    persistence: 'Redis',
    features: [
      'Persistencia con Redis (alta disponibilidad)',
      'Control completo de workers (start/pause/resume/stop)',
      'Sistema de callbacks configurable',
      'Interfaz web de control',
      'Monitoreo en tiempo real',
      'Procesamiento distribuido',
      'Escalabilidad horizontal',
      'Operaciones atómicas con Redis'
    ],
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      db: process.env.REDIS_DB || 0
    },
    endpoints: {
      // Endpoints principales
      health: '/api/v1/health',
      estudiantes: '/api/v1/estudiantes',
      inscripciones: '/api/v1/inscripciones',
      
      // Endpoints del sistema de colas
      queueSystem: {
        health: '/api/v1/queue/health',
        dashboard: '/api/v1/queue/dashboard',
        redisInfo: '/api/v1/queue/redis/info',
        
        // Gestión de colas
        queues: {
          create: 'POST /api/v1/queue/{queueName}',
          delete: 'DELETE /api/v1/queue/{queueName}',
          stats: 'GET /api/v1/queue/{queueName}/stats',
          tasks: 'GET /api/v1/queue/{queueName}/tasks',
          clear: 'DELETE /api/v1/queue/{queueName}/clear',
          clearByStatus: 'DELETE /api/v1/queue/{queueName}/clear/{status}',
          allStats: 'GET /api/v1/queue/stats/all'
        },
        
        // Control de workers
        workers: {
          create: 'POST /api/v1/queue/{queueName}/workers',
          start: 'POST /api/v1/queue/workers/{workerId}/start',
          pause: 'POST /api/v1/queue/workers/{workerId}/pause',
          resume: 'POST /api/v1/queue/workers/{workerId}/resume',
          stop: 'DELETE /api/v1/queue/workers/{workerId}',
          status: 'GET /api/v1/queue/workers/{workerId}/status',
          stats: 'GET /api/v1/queue/workers/{workerId}/stats',
          all: 'GET /api/v1/queue/workers',
          
          // Control por cola
          pauseAll: 'POST /api/v1/queue/{queueName}/workers/pause',
          resumeAll: 'POST /api/v1/queue/{queueName}/workers/resume'
        },
        
        // Sistema de callbacks
        callbacks: {
          register: 'POST /api/v1/queue/callbacks/{eventType}/{callbackId}',
          registerCustom: 'POST /api/v1/queue/callbacks/{eventType}/{callbackId}/custom',
          remove: 'DELETE /api/v1/queue/callbacks/{eventType}/{callbackId}',
          test: 'POST /api/v1/queue/callbacks/{eventType}/{callbackId}/test',
          list: 'GET /api/v1/queue/callbacks',
          history: 'GET /api/v1/queue/callbacks/history',
          stats: 'GET /api/v1/queue/callbacks/stats'
        },
        
        // Operaciones de datos
        operations: {
          saveRecord: 'POST /api/v1/queue/{queueName}/{model}/save',
          updateRecord: 'PUT /api/v1/queue/{queueName}/{model}/{id}',
          deleteRecord: 'DELETE /api/v1/queue/{queueName}/{model}/{id}',
          bulkSave: 'POST /api/v1/queue/{queueName}/{model}/bulk-save'
        }
      }
    },
    examples: {
      createQueue: {
        method: 'POST',
        url: '/api/v1/queue/docentes_queue',
        description: 'Crear nueva cola (persistida en Redis)'
      },
      createWorker: {
        method: 'POST',
        url: '/api/v1/queue/docentes_queue/workers',
        body: {
          threadCount: 2,
          autoStart: false
        },
        description: 'Crear worker pausado (para control manual)'
      },
      saveDocente: {
        method: 'POST',
        url: '/api/v1/queue/docentes_queue/Docente/save',
        body: {
          data: {
            nombre: 'Juan Pérez',
            email: 'juan@universidad.com'
          }
        },
        description: 'Guardar docente en cola Redis (persiste automáticamente)'
      },
      clearQueue: {
        method: 'DELETE',
        url: '/api/v1/queue/docentes_queue/clear/completed',
        description: 'Limpiar tareas completadas de la cola'
      },
      redisInfo: {
        method: 'GET',
        url: '/api/v1/queue/redis/info',
        description: 'Información del estado de Redis'
      }
    },
    advantages: {
      redis: [
        'Persistencia automática y confiable',
        'Operaciones atómicas (ACID)',
        'Soporte para múltiples instancias de la aplicación',
        'Mejor rendimiento que archivos JSON',
        'Capacidades de clustering y replicación',
        'Monitoreo avanzado con herramientas Redis',
        'Backup y recovery más robustos'
      ]
    }
  });
});

// Middlewares de error
app.use(notFound);
app.use(errorHandler);

// Variables globales para los servicios
let queueService = null;
let callbackService = null;

const initializeApp = async () => {
  try {
    console.log('🚀 Iniciando aplicación con Redis...');

    // 1. Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');

    // 2. Inicializar sistema de callbacks
    console.log('🔄 Inicializando sistema de callbacks...');
    callbackService = new CallbackService();
    callbackService.setupDefaultCallbacks();
    console.log('✅ Sistema de callbacks inicializado');

    // 3. Inicializar sistema de colas con Redis
    console.log('🔄 Inicializando sistema de colas con Redis...');
    queueService = new QueueService(); // Ahora usa RedisQueueManager internamente
    await queueService.initialize();
    console.log('✅ Sistema de colas Redis inicializado');

    // 4. Verificar conexión a Redis
    try {
      const redisInfo = await queueService.getRedisInfo();
      console.log('✅ Conexión a Redis establecida');
      console.log(`   Redis versión: ${redisInfo.redis.info.redis_version || 'N/A'}`);
      console.log(`   Memoria usada: ${redisInfo.redis.memory.used_memory_human || 'N/A'}`);
    } catch (error) {
      console.error('❌ Error conectando a Redis:', error.message);
      console.log('💡 Asegúrate de que Redis esté ejecutándose:');
      console.log('   - Docker: docker run -d -p 6379:6379 redis:alpine');
      console.log('   - Local: redis-server');
      process.exit(1);
    }

    // 5. Crear colas por defecto
    console.log('🔄 Creando colas por defecto en Redis...');
    await queueService.createQueue('default_queue');
    await queueService.createQueue('docentes_queue');
    await queueService.createQueue('estudiantes_queue');
    await queueService.createQueue('inscripciones_queue');
    await queueService.createQueue('bulk_operations');
    console.log('✅ Colas por defecto creadas en Redis');

    // 6. Crear workers por defecto (pausados para control manual)
    console.log('🔄 Creando workers por defecto...');
    
    const workerConfigs = [
      { queue: 'default_queue', threads: 2, autoStart: false },
      { queue: 'docentes_queue', threads: 2, autoStart: false },
      { queue: 'estudiantes_queue', threads: 2, autoStart: false },
      { queue: 'inscripciones_queue', threads: 3, autoStart: false },
      { queue: 'bulk_operations', threads: 4, autoStart: false }
    ];

    for (const config of workerConfigs) {
      const result = await queueService.createWorker(
        config.queue, 
        config.threads, 
        { 
          autoStart: config.autoStart,
          onTaskCompleted: async (data) => {
            await callbackService.executeCallbacks('task:completed', data);
          },
          onTaskFailed: async (data) => {
            await callbackService.executeCallbacks('task:failed', data);
          },
          onTaskError: async (data) => {
            await callbackService.executeCallbacks('task:error', data);
          },
          onWorkerError: async (error, workerId) => {
            await callbackService.executeCallbacks('worker:error', { error, workerId });
          }
        }
      );
      
      console.log(`   - Worker creado para ${config.queue}: ${result.workerId} (${config.autoStart ? 'iniciado' : 'pausado'})`);
    }

    console.log('✅ Workers por defecto creados');

    // 7. Sincronizar modelos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ Modelos sincronizados');
    }

    // 8. Mostrar información de Redis
    console.log('\n📊 INFORMACIÓN DE REDIS:');
    console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`   Puerto: ${process.env.REDIS_PORT || 6379}`);
    console.log(`   DB: ${process.env.REDIS_DB || 0}`);

    console.log('\n🎉 ¡SISTEMA CON REDIS INICIADO CORRECTAMENTE!');
    console.log('📊 Dashboard disponible en: http://localhost:3000/api/v1/queue/dashboard');
    console.log('🔍 Info de Redis: http://localhost:3000/api/v1/queue/redis/info');
    console.log('💡 Los workers están PAUSADOS por defecto para que tengas control total');
    console.log('💡 Todas las colas ahora persisten automáticamente en Redis');
    
    console.log('\n📖 VENTAJAS DE REDIS:');
    console.log('✅ Persistencia automática y confiable');
    console.log('✅ Operaciones atómicas (no más archivos corruptos)');
    console.log('✅ Soporte para múltiples instancias de la aplicación');
    console.log('✅ Mejor rendimiento que archivos JSON');
    console.log('✅ Capacidades de clustering y monitoreo avanzado');

    console.log('\n📖 EJEMPLO DE USO:');
    console.log('1. Crear datos: POST /api/v1/queue/docentes_queue/Docente/save');
    console.log('2. Los datos se guardan en Redis inmediatamente');
    console.log('3. Iniciar worker: POST /api/v1/queue/workers/{workerId}/start');
    console.log('4. ¡Los datos se procesan desde Redis y aparecen en DB!');
    console.log('5. Limpiar completados: DELETE /api/v1/queue/docentes_queue/clear/completed');

  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    
    if (error.message.includes('Redis') || error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUCIÓN PARA REDIS:');
      console.log('Instalar y ejecutar Redis:');
      console.log('  Docker: docker run -d --name redis -p 6379:6379 redis:alpine');
      console.log('  Ubuntu: sudo apt install redis-server && sudo systemctl start redis');
      console.log('  macOS: brew install redis && brew services start redis');
      console.log('  Windows: descargar desde https://redis.io/download');
    }
    
    process.exit(1);
  }
};

// Manejo de cierre graceful
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Recibida señal ${signal}, cerrando aplicación...`);
  
  try {
    // Cerrar sistema de callbacks
    if (callbackService) {
      console.log('🔄 Cerrando sistema de callbacks...');
      callbackService.clearAllCallbacks();
    }

    // Cerrar sistema de colas (incluye cierre de conexión Redis)
    if (queueService) {
      console.log('🔄 Cerrando sistema de colas y Redis...');
      await queueService.shutdown();
    }

    // Cerrar conexión a la base de datos
    console.log('🔄 Cerrando conexión a la base de datos...');
    await sequelize.close();

    console.log('✅ Aplicación cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el cierre:', error);
    process.exit(1);
  }
};

// Registrar manejadores de señales
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  
  if (error.message.includes('Redis')) {
    console.log('💡 Error relacionado con Redis - verificar conexión');
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  
  if (reason && reason.message && reason.message.includes('Redis')) {
    console.log('💡 Error relacionado con Redis - verificar conexión');
  }
  
  process.exit(1);
});

// Inicializar aplicación solo si es el archivo principal
if (require.main === module) {
  initializeApp();
}

// Exportar app y servicios para uso externo
module.exports = { 
  app, 
  queueService: () => queueService, 
  callbackService: () => callbackService 
};