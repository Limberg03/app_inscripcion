// server.js - VERSIÓN CORREGIDA Y ÚNICO PUNTO DE ENTRADA
const { app, initializeApp } = require('./app'); // <-- IMPORTA AMBOS

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Llama a la lógica de inicialización primero
    await initializeApp();

    // 2. Una vez que todo está inicializado, inicia el servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor escuchando en http://localhost:${PORT}`);
      // El dashboard ahora estará en /public/dashboard.html (ver pregunta 2)
      console.log(`📊 Dashboard de colas: http://localhost:${PORT}/public/dashboard.html`);
      console.log('💡 Los workers están PAUSADOS por defecto. Inícialos vía API desde el dashboard.');
    });
  } catch (error) {
    // La lógica de error ya está en initializeApp, pero podemos añadir un log aquí por si acaso
    console.error('❌ Fallo crítico al intentar iniciar el servidor.', error);
    process.exit(1);
  }
};

// Llama a la función para iniciar todo el proceso
startServer();