require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models/index');
const routes = require('./routes/index');
const { notFound, errorHandler, requestLogger } = require('./middleware/index');

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


app.use('/', routes);


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

const initializeApp = async () => {
  try {

    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');


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
  await sequelize.close();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  await sequelize.close();
  console.log('✅ Conexiones cerradas');
  process.exit(0);
});

// Inicializar aplicación
if (require.main === module) {
  initializeApp();
}

module.exports = app;