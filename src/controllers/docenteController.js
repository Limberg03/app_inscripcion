const { Docente, GrupoMateria, Materia } = require('../models');
const { validationResult } = require('express-validator');

const docenteController = {
  // Obtener todos los docentes
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const docentes = await Docente.findAndCountAll({
        limit,
        offset,
        include: [{
          model: GrupoMateria,
          as: 'grupos', // Cambiado de 'gruposMateria' a 'grupos'
          attributes: ['id', 'numero', 'estado'],
          include: [{
            model: Materia,
            as: 'materia',
            attributes: ['id', 'nombre', 'sigla', 'creditos']
          }]
        }],
        order: [['id', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: docentes.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(docentes.count / limit),
          totalItems: docentes.count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener docentes',
        error: error.message
      });
    }
  },

  // Obtener docente por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const docente = await Docente.findByPk(id, {
        include: [{
          model: GrupoMateria,
          as: 'grupos', // Cambiado de 'gruposMateria' a 'grupos'
          attributes: ['id', 'numero', 'estado'],
          include: [{
            model: Materia,
            as: 'materia',
            attributes: ['id', 'nombre', 'sigla', 'creditos']
          }]
        }]
      });

      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: docente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener docente',
        error: error.message
      });
    }
  },

  // Crear nuevo docente
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

      const { nombre, telefono } = req.body;
      
      const docente = await Docente.create({
        nombre,
        telefono
      });

      res.status(201).json({
        success: true,
        message: 'Docente creado exitosamente',
        data: docente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear docente',
        error: error.message
      });
    }
  },

  // Actualizar docente
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
      const { nombre, telefono } = req.body;

      const docente = await Docente.findByPk(id);
      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente no encontrado'
        });
      }

      await docente.update({
        nombre,
        telefono
      });

      res.status(200).json({
        success: true,
        message: 'Docente actualizado exitosamente',
        data: docente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar docente',
        error: error.message
      });
    }
  },

  // Eliminar docente
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const docente = await Docente.findByPk(id);
      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente no encontrado'
        });
      }

      await docente.destroy();

      res.status(200).json({
        success: true,
        message: 'Docente eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar docente',
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

      const docente = await Docente.findByPk(id);
      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente no encontrado'
        });
      }

      await docente.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Docente actualizado parcialmente',
        data: docente
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar docente',
        error: error.message
      });
    }
  }
};

module.exports = docenteController;