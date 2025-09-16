const { Nivel, Materia } = require('../models');
const { validationResult } = require('express-validator');

const nivelController = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const niveles = await Nivel.findAndCountAll({
        // limit,
        // offset,
        include: [{
          model: Materia,
          as: 'materias',
          attributes: ['id', 'nombre', 'sigla', 'creditos']
        }],
        order: [['id', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: niveles.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(niveles.count / limit),
          totalItems: niveles.count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener niveles',
        error: error.message
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const nivel = await Nivel.findByPk(id, {
        include: [{
          model: Materia,
          as: 'materias',
          attributes: ['id', 'nombre', 'sigla', 'creditos']
        }]
      });

      if (!nivel) {
        return res.status(404).json({
          success: false,
          message: 'Nivel no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: nivel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener nivel',
        error: error.message
      });
    }
  },

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

    const { nombre, materias } = req.body;

    // Crear el nivel
    const nivel = await Nivel.create({ nombre });

    // Crear materias si existen
    if (materias && Array.isArray(materias)) {
      for (const materia of materias) {
        await Materia.create({
          nombre: materia.nombre,
          sigla: materia.sigla,
          creditos: materia.creditos,
          nivelId: nivel.id,              // 👈 usa el nombre real de la FK
          planEstudioId: materia.planEstudioId // 👈 obligatorio en tu modelo
        });
      }
    }

    // Traer nivel con materias
    const nivelConMaterias = await Nivel.findByPk(nivel.id, {
      include: [{
        model: Materia,
        as: 'materias',
        attributes: ['id', 'nombre', 'sigla', 'creditos', 'planEstudioId']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Nivel creado exitosamente',
      data: nivelConMaterias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear nivel',
      error: error.message
    });
  }
},


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
      const { nombre } = req.body;

      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({
          success: false,
          message: 'Nivel no encontrado'
        });
      }

      await nivel.update({ nombre });

      res.status(200).json({
        success: true,
        message: 'Nivel actualizado exitosamente',
        data: nivel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar nivel',
        error: error.message
      });
    }
  },

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

      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({
          success: false,
          message: 'Nivel no encontrado'
        });
      }

      await nivel.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Nivel actualizado parcialmente',
        data: nivel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar nivel',
        error: error.message
      });
    }
  },
   delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const nivel = await Nivel.findByPk(id);
      if (!nivel) {
        return res.status(404).json({
          success: false,
          message: 'Nivel no encontrado'
        });
      }

      await nivel.destroy();

      res.status(200).json({
        success: true,
        message: 'Nivel eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar nivel',
        error: error.message
      });
    }
  }
};

module.exports = nivelController;