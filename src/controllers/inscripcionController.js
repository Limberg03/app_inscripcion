const { Inscripcion, Estudiante } = require('../models');
const { validationResult } = require('express-validator');

const inscripcionController = {
  // Obtener todas las inscripciones
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { gestion } = req.query;

      const where = {};
      if (gestion) {
        where.gestion = gestion;
      }

      const inscripciones = await Inscripcion.findAndCountAll({
        where,
        limit,
        offset,
        include: [{
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'numero', 'registro', 'telefono']
        }],
        order: [['fecha', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: inscripciones.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(inscripciones.count / limit),
          totalItems: inscripciones.count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener inscripciones',
        error: error.message
      });
    }
  },

  // Obtener inscripción por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const inscripcion = await Inscripcion.findByPk(id, {
        include: [{
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'numero', 'registro', 'telefono', 'fechaNac']
        }]
      });

      if (!inscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Inscripción no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: inscripcion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener inscripción',
        error: error.message
      });
    }
  },

  // Crear nueva inscripción
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

      const { fecha, gestion, estudianteId } = req.body;

      // Verificar que el estudiante existe
      const estudiante = await Estudiante.findByPk(estudianteId);
      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      const inscripcion = await Inscripcion.create({
        fecha: fecha || new Date(),
        gestion,
        estudianteId
      });

      // Obtener la inscripción con el estudiante incluido
      const inscripcionCompleta = await Inscripcion.findByPk(inscripcion.id, {
        include: [{
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'numero', 'registro', 'telefono']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Inscripción creada exitosamente',
        data: inscripcionCompleta
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear inscripción',
        error: error.message
      });
    }
  },

  // Actualizar inscripción
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
      const { fecha, gestion, estudianteId } = req.body;

      const inscripcion = await Inscripcion.findByPk(id);
      if (!inscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Inscripción no encontrada'
        });
      }

      // Verificar que el estudiante existe si se está actualizando
      if (estudianteId) {
        const estudiante = await Estudiante.findByPk(estudianteId);
        if (!estudiante) {
          return res.status(404).json({
            success: false,
            message: 'Estudiante no encontrado'
          });
        }
      }

      await inscripcion.update({
        fecha,
        gestion,
        estudianteId
      });

      // Obtener la inscripción actualizada con el estudiante incluido
      const inscripcionActualizada = await Inscripcion.findByPk(id, {
        include: [{
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'numero', 'registro', 'telefono']
        }]
      });

      res.status(200).json({
        success: true,
        message: 'Inscripción actualizada exitosamente',
        data: inscripcionActualizada
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar inscripción',
        error: error.message
      });
    }
  },

  // Eliminar inscripción
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const inscripcion = await Inscripcion.findByPk(id);
      if (!inscripcion) {
        return res.status(404).json({
          success: false,
          message: 'Inscripción no encontrada'
        });
      }

      await inscripcion.destroy();

      res.status(200).json({
        success: true,
        message: 'Inscripción eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar inscripción',
        error: error.message
      });
    }
  },

  // Obtener inscripciones por estudiante
  getByEstudiante: async (req, res) => {
    try {
      const { estudianteId } = req.params;
      
      const estudiante = await Estudiante.findByPk(estudianteId);
      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      const inscripciones = await Inscripcion.findAll({
        where: { estudianteId },
        include: [{
          model: Estudiante,
          as: 'estudiante',
          attributes: ['id', 'numero', 'registro', 'telefono']
        }],
        order: [['gestion', 'DESC'], ['fecha', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: inscripciones
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener inscripciones del estudiante',
        error: error.message
      });
    }
  }
};

module.exports = inscripcionController;