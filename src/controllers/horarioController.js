const { Horario } = require('../models');
const { validationResult } = require('express-validator');

const horarioController = {
  // Obtener todos los horarios
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const horarios = await Horario.findAndCountAll({
       
        order: [['dia', 'ASC'], ['horaInicio', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: horarios.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(horarios.count / limit),
          totalItems: horarios.count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener horarios',
        error: error.message
      });
    }
  },

  // Obtener horario por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const horario = await Horario.findByPk(id);

      if (!horario) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: horario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener horario',
        error: error.message
      });
    }
  },

  // Crear nuevo horario
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

      const { dia, horaInicio, horaFin } = req.body;

      // Verificar que no haya conflicto de horarios en el mismo día y horas
      const conflicto = await Horario.findOne({
        where: {
          dia,
          [require('sequelize').Op.or]: [
            {
              horaInicio: {
                [require('sequelize').Op.between]: [horaInicio, horaFin]
              }
            },
            {
              horaFin: {
                [require('sequelize').Op.between]: [horaInicio, horaFin]
              }
            },
            {
              [require('sequelize').Op.and]: [
                { horaInicio: { [require('sequelize').Op.lte]: horaInicio } },
                { horaFin: { [require('sequelize').Op.gte]: horaFin } }
              ]
            }
          ]
        }
      });

      if (conflicto) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un horario que se superpone en ese día y horario'
        });
      }
      
      const horario = await Horario.create({
        dia,
        horaInicio,
        horaFin     
      });

      res.status(201).json({
        success: true,
        message: 'Horario creado exitosamente',
        data: horario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear horario',
        error: error.message
      });
    }
  },

  // Actualizar horario
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
      const { dia, horaInicio, horaFin } = req.body;

      const horario = await Horario.findByPk(id);
      if (!horario) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      // Verificar conflicto excluyendo el horario actual
      const conflicto = await Horario.findOne({
        where: {
          id: { [require('sequelize').Op.ne]: id },
          dia,
          [require('sequelize').Op.or]: [
            {
              horaInicio: {
                [require('sequelize').Op.between]: [horaInicio, horaFin]
              }
            },
            {
              horaFin: {
                [require('sequelize').Op.between]: [horaInicio, horaFin]
              }
            },
            {
              [require('sequelize').Op.and]: [
                { horaInicio: { [require('sequelize').Op.lte]: horaInicio } },
                { horaFin: { [require('sequelize').Op.gte]: horaFin } }
              ]
            }
          ]
        }
      });

      if (conflicto) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un horario que se superpone en ese día y horario'
        });
      }

      await horario.update({
        dia,
        horaInicio,
        horaFin
      });

      res.status(200).json({
        success: true,
        message: 'Horario actualizado exitosamente',
        data: horario
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar horario',
        error: error.message
      });
    }
  },

  // Eliminar horario
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const horario = await Horario.findByPk(id);
      if (!horario) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      await horario.destroy();

      res.status(200).json({
        success: true,
        message: 'Horario eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar horario',
        error: error.message
      });
    }
  },

};

module.exports = horarioController;