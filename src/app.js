require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models/index');
const routes = require('./routes/index');
const { notFound, errorHandler, requestLogger } = require('./middleware/index');

const queueRoutes = require('./routes/queueRoutes');
//const autoAsyncMiddleware = require('./middleware/autoAsyncMiddleware');



const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet());


app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}


//app.use(autoAsyncMiddleware());
app.use('/', routes);
// app.use('/queue', queueRoutes);
app.use('/queue', queueRoutes);



app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Microservicio de Estudiantes e Inscripciones',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      estudiantes: '/api/v1/estudiantes',
      inscripciones: '/api/v1/inscripciones'
    }
  });
});

app.use(notFound);
app.use(errorHandler);

const QueueService = require('./services/QueueService');
let queueService = null;

const initializeApp = async () => {
  try {

    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');

// Inicializar sistema de colas
    queueService = new QueueService();
    await queueService.initialize();
    
    // Crear colas por defecto
    await queueService.createQueue('default_queue');
    await queueService.createQueue('inscriptions_queue');
    await queueService.createQueue('bulk_operations');
    
    // Crear workers por defecto
    await queueService.createWorker('default_queue', 2);
    await queueService.createWorker('inscriptions_queue', 2);
    await queueService.createWorker('bulk_operations', 4);
    
    console.log('✅ Sistema de colas inicializado');


    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('✅ Modelos sincronizados');
    }

  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor...');
  if (queueService) {
    await queueService.shutdown();
  }
  await sequelize.close();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  if (queueService) {
    await queueService.shutdown();
  }
  await sequelize.close();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

// Inicializar aplicación
if (require.main === module) {
  initializeApp();
}

module.exports = app;