const { Nivel, Materia } = require('../models');
const { validationResult } = require('express-validator');

// Simulación de procesamiento pesado ultra optimizada
const simulateHeavyProcessingAsync = () => {
  return new Promise((resolve) => {
    const iterations = 1000000; // Reducido drásticamente de 10M a 1M
    let sum = 0;
    let i = 0;
    
    const process = () => {
      const batchSize = 50000; // Lotes más pequeños para mejor rendimiento
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

// Delay ultra reducido
const addRandomDelayAsync = () => {
  const minDelay = 20; // Reducido drásticamente
  const maxDelay = 50; // Reducido drásticamente
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

const nivelControllerSync = {
  getAll: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Ejecutar TODO en paralelo para máxima velocidad
      const [niveles, _, __] = await Promise.all([
        Nivel.findAndCountAll({
          include: [{ model: Materia, as: 'materias', attributes: ['id', 'nombre', 'sigla', 'creditos'] }],
          order: [['id', 'ASC']]
        }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({
        success: true,
        data: niveles.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(niveles.count / limit),
          totalItems: niveles.count,
          itemsPerPage: limit
        },
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel',
          includesRelations: true
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener niveles', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  getById: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      
      // Ejecutar TODO en paralelo para máxima velocidad
      const [nivel, _, __] = await Promise.all([
        Nivel.findByPk(id, {
          include: [{ model: Materia, as: 'materias', attributes: ['id', 'nombre', 'sigla', 'creditos'] }]
        }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      res.status(200).json({ 
        success: true, 
        data: nivel,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel',
          includesRelations: true
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener nivel', error: error.message });
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

      const { nombre, materias } = req.body;
      
      // Ejecutar TODO en paralelo para máxima velocidad
      const [nivel, _, __] = await Promise.all([
        Nivel.create({ nombre }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      // Si hay materias, crearlas en paralelo también
      if (materias && Array.isArray(materias)) {
        const materiasPromises = materias.map(materia => 
          Materia.create({
            nombre: materia.nombre,
            sigla: materia.sigla,
            creditos: materia.creditos,
            nivelId: nivel.id,
            planEstudioId: materia.planEstudioId
          })
        );

        // Ejecutar creación de materias en paralelo con procesamiento
        await Promise.all([
          Promise.all(materiasPromises),
          simulateHeavyProcessingAsync(),
          addRandomDelayAsync()
        ]);
      }

      // Obtener nivel con materias en paralelo con procesamiento
      const [nivelConMaterias, ___, ____] = await Promise.all([
        Nivel.findByPk(nivel.id, {
          include: [{ model: Materia, as: 'materias' }]
        }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(201).json({ 
        success: true, 
        message: 'Nivel creado exitosamente', 
        data: nivelConMaterias,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel',
          materiasCreadas: materias ? materias.length : 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear nivel', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  update: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
      
      const { id } = req.params;
      const { nombre } = req.body;

      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [updatedNivel, _, __] = await Promise.all([
        nivel.update({ nombre }),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Nivel actualizado exitosamente', 
        data: updatedNivel,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar nivel', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  patch: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
      
      const { id } = req.params;
      const updateData = req.body;

      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [updatedNivel, _, __] = await Promise.all([
        nivel.update(updateData),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Nivel actualizado parcialmente', 
        data: updatedNivel,
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar nivel', error: error.message });
    } finally {
      connectionPool.release();
    }
  },

  delete: async (req, res) => {
    await connectionPool.acquire();
    
    try {
      const { id } = req.params;
      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      // Ejecutar TODO en paralelo para máxima velocidad
      const [_, __, ___] = await Promise.all([
        nivel.destroy(),
        simulateHeavyProcessingAsync(),
        addRandomDelayAsync()
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Nivel eliminado exitosamente',
        processingInfo: {
          asyncProcessing: true,
          optimized: true,
          timestamp: new Date().toISOString(),
          controller: 'nivel'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar nivel', error: error.message });
    } finally {
      connectionPool.release();
    }
  }
};

module.exports = nivelControllerSync;