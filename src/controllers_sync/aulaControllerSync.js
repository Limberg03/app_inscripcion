const { Aula } = require('../models');
const { validationResult } = require('express-validator');

// Simulación de procesamiento pesado de manera no bloqueante
const simulateHeavyProcessingAsync = () => {
  return new Promise((resolve) => {
    const iterations = 10000000; // Reducido significativamente
    let sum = 0;
    let i = 0;
    
    const process = () => {
      const batchSize = 100000;
      const end = Math.min(i + batchSize, iterations);
      
      while (i < end) {
        sum += Math.sqrt(i);
        i++;
      }
      
      if (i < iterations) {
        // Usar setImmediate para no bloquear el event loop
        setImmediate(process);
      } else {
        resolve(sum);
      }
    };
    
    process();
  });
};

// Delay no bloqueante
const addRandomDelayAsync = () => {
  const minDelay = 200; // Reducido significativamente
  const maxDelay = 400; // Reducido significativamente
  const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Pool de conexiones simulado para limitar concurrencia
class ConnectionPool {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.queue = [];
  }
  
  async acquire() {
    return new Promise((resolve) => {
      if (this.activeConnections < this.maxConnections) {
        this.activeConnections++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  release() {
    this.activeConnections--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.activeConnections++;
      next();
    }
  }
}

const connectionPool = new ConnectionPool(25); // Aumentado a 25 conexiones simultáneas

const aulaControllerSync = {
  getAll: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const { capacidadMin, capacidadMax, estado } = req.query;

      const where = {};
      if (capacidadMin || capacidadMax) {
        where.capacidad = {};
        if (capacidadMin) where.capacidad[require('sequelize').Op.gte] = parseInt(capacidadMin);
        if (capacidadMax) where.capacidad[require('sequelize').Op.lte] = parseInt(capacidadMax);
      }
      if (estado !== undefined) {
        where.estado = estado === 'true';
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [aulas, _, __] = await Promise.all([
        Aula.findAndCountAll({ where, order: [['nombre', 'ASC']] }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({
        success: true,
        data: aulas.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(aulas.count / limit),
          totalItems: aulas.count,
          itemsPerPage: limit
        },
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener aulas', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  getById: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      
      // Ejecutar TODO en paralelo para máxima velocidad
      const [aula, _, __] = await Promise.all([
        Aula.findByPk(id),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }
      
      res.status(200).json({ 
        success: true, 
        data: aula,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener aula', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  create: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }

      const { nombre, capacidad, estado } = req.body;
      
      // Ejecutar TODO en paralelo para máxima velocidad
      const [aula, _, __] = await Promise.all([
        Aula.create({
          nombre,
          capacidad,
          estado: estado !== undefined ? estado : true
        }),
        simulateHeavyProcessingAsync(), // Procesamiento en paralelo
        addRandomDelayAsync() // Delay en paralelo
      ]);

      res.status(201).json({ 
        success: true, 
        message: 'Aula creada exitosamente', 
        data: aula,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al crear aula', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  update: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      const { nombre, capacidad, estado } = req.body;

      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [_, __, ___] = await Promise.all([
        aula.update({ nombre, capacidad, estado }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Aula actualizada exitosamente', 
        data: aula,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al actualizar aula', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  delete: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [_, __, ___] = await Promise.all([
        aula.destroy(),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Aula eliminada exitosamente',
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar aula', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  patch: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [_, __, ___] = await Promise.all([
        aula.update(updateData),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Aula actualizada parcialmente', 
        data: aula,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al actualizar aula', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  getAvailable: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { capacidadMin } = req.query;
      const where = { estado: true };
      if (capacidadMin) {
        where.capacidad = { [require('sequelize').Op.gte]: parseInt(capacidadMin) };
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [aulas, _, __] = await Promise.all([
        Aula.findAll({ where, order: [['capacidad', 'ASC'], ['nombre', 'ASC']] }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        data: aulas,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener aulas disponibles', error: error.message });
    } finally {
      connectionPool.release();
    }
  }
};

module.exports = aulaControllerSync;