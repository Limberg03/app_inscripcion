const { Aula, Horario } = require('../models');
const { validationResult } = require('express-validator');

const aulaController = {
  // Obtener todas las aulas
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { capacidadMin, capacidadMax, estado } = req.query;

      const where = {};
      if (capacidadMin || capacidadMax) {
        where.capacidad = {};
        if (capacidadMin) where.capacidad.$gte = parseInt(capacidadMin);
        if (capacidadMax) where.capacidad.$lte = parseInt(capacidadMax);
      }
      if (estado !== undefined) {
        where.estado = estado === 'true';
      }

      const aulas = await Aula.findAndCountAll({
        where,
   
       
        order: [['nombre', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: aulas.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(aulas.count / limit),
          totalItems: aulas.count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener aulas',
        error: error.message
      });
    }
  },

  // Obtener aula por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const aula = await Aula.findByPk(id, {
       
      });

      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: aula
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener aula',
        error: error.message
      });
    }
  },

  // Crear nueva aula
  create: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { nombre, capacidad, estado } = req.body;
      
      const aula = await Aula.create({
        nombre,
        capacidad,
        estado: estado !== undefined ? estado : true
      });

      res.status(201).json({
        success: true,
        message: 'Aula creada exitosamente',
        data: aula
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'El código de aula ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear aula',
        error: error.message
      });
    }
  },

  // Actualizar aula
  update: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { nombre, capacidad, estado } = req.body;

      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      await aula.update({
        nombre,
        capacidad,
        estado
      });

      res.status(200).json({
        success: true,
        message: 'Aula actualizada exitosamente',
        data: aula
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'El código de aula ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar aula',
        error: error.message
      });
    }
  },

  // Eliminar aula
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      await aula.destroy();

      res.status(200).json({
        success: true,
        message: 'Aula eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar aula',
        error: error.message
      });
    }
  },

  // Actualización parcial con PATCH
  patch: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const aula = await Aula.findByPk(id);
      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      await aula.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Aula actualizada parcialmente',
        data: aula
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'El código de aula ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar aula',
        error: error.message
      });
    }
  },

  // Obtener aulas disponibles (activas y con capacidad)
  getAvailable: async (req, res) => {
    try {
      const { capacidadMin } = req.query;

      const where = { estado: true };
      if (capacidadMin) {
        where.capacidad = { $gte: parseInt(capacidadMin) };
      }

      const aulas = await Aula.findAll({
        where,
        order: [['capacidad', 'ASC'], ['nombre', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: aulas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener aulas disponibles',
        error: error.message
      });
    }
  }
};

module.exports = aulaController;