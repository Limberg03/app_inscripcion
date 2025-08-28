const { Horario, GrupoMateria, Aula } = require('../models');
const { validationResult } = require('express-validator');

const horarioController = {
  // Obtener todos los horarios
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { grupoMateriaId, aulaId } = req.query;

      const where = {};
      if (grupoMateriaId) {
        where.grupoMateriaId = grupoMateriaId;
      }
      if (aulaId) {
        where.aulaId = aulaId;
      }

      const horarios = await Horario.findAndCountAll({
        where,
        limit,
        offset,
        include: [
          {
            model: GrupoMateria,
            as: 'grupoMateria',
            attributes: ['id', 'numero', 'estado']
          },
          {
            model: Aula,
            as: 'aula',
            attributes: ['id', 'codigo', 'capacidad']
          }
        ],
        order: [['fechaIni', 'ASC']]
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
      const horario = await Horario.findByPk(id, {
        include: [
          {
            model: GrupoMateria,
            as: 'grupoMateria',
            attributes: ['id', 'numero', 'estado']
          },
          {
            model: Aula,
            as: 'aula',
            attributes: ['id', 'codigo', 'capacidad']
          }
        ]
      });

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

      const { fechaIni, fechaFinal, grupoMateriaId, aulaId } = req.body;

      // Verificar que el grupo de materia existe
      const grupoMateria = await GrupoMateria.findByPk(grupoMateriaId);
      if (!grupoMateria) {
        return res.status(404).json({
          success: false,
          message: 'Grupo de materia no encontrado'
        });
      }

      // Verificar que el aula existe
      const aula = await Aula.findByPk(aulaId);
      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      // Verificar que no haya conflicto de horarios en la misma aula
      const conflicto = await Horario.findOne({
        where: {
          aulaId,
          [require('sequelize').Op.or]: [
            {
              fechaIni: {
                [require('sequelize').Op.between]: [fechaIni, fechaFinal]
              }
            },
            {
              fechaFinal: {
                [require('sequelize').Op.between]: [fechaIni, fechaFinal]
              }
            },
            {
              [require('sequelize').Op.and]: [
                { fechaIni: { [require('sequelize').Op.lte]: fechaIni } },
                { fechaFinal: { [require('sequelize').Op.gte]: fechaFinal } }
              ]
            }
          ]
        }
      });

      if (conflicto) {
        return res.status(400).json({
          success: false,
          message: 'El aula ya está ocupada en ese horario'
        });
      }
      
      const horario = await Horario.create({
        fechaIni,
        fechaFinal,
        grupoMateriaId,
        aulaId
      });

      // Obtener el horario con las relaciones incluidas
      const horarioCompleto = await Horario.findByPk(horario.id, {
        include: [
          {
            model: GrupoMateria,
            as: 'grupoMateria',
            attributes: ['id', 'numero', 'estado']
          },
          {
            model: Aula,
            as: 'aula',
            attributes: ['id', 'codigo', 'capacidad']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Horario creado exitosamente',
        data: horarioCompleto
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
      const { fechaIni, fechaFinal, grupoMateriaId, aulaId } = req.body;

      const horario = await Horario.findByPk(id);
      if (!horario) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      // Verificar que el grupo de materia existe si se está actualizando
      if (grupoMateriaId) {
        const grupoMateria = await GrupoMateria.findByPk(grupoMateriaId);
        if (!grupoMateria) {
          return res.status(404).json({
            success: false,
            message: 'Grupo de materia no encontrado'
          });
        }
      }

      // Verificar que el aula existe si se está actualizando
      if (aulaId) {
        const aula = await Aula.findByPk(aulaId);
        if (!aula) {
          return res.status(404).json({
            success: false,
            message: 'Aula no encontrada'
          });
        }

        // Verificar conflictos de horario si se actualiza aula o fechas
        if (aulaId !== horario.aulaId || fechaIni || fechaFinal) {
          const nuevaFechaIni = fechaIni || horario.fechaIni;
          const nuevaFechaFinal = fechaFinal || horario.fechaFinal;

          const conflicto = await Horario.findOne({
            where: {
              id: { [require('sequelize').Op.ne]: id },
              aulaId: aulaId || horario.aulaId,
              [require('sequelize').Op.or]: [
                {
                  fechaIni: {
                    [require('sequelize').Op.between]: [nuevaFechaIni, nuevaFechaFinal]
                  }
                },
                {
                  fechaFinal: {
                    [require('sequelize').Op.between]: [nuevaFechaIni, nuevaFechaFinal]
                  }
                },
                {
                  [require('sequelize').Op.and]: [
                    { fechaIni: { [require('sequelize').Op.lte]: nuevaFechaIni } },
                    { fechaFinal: { [require('sequelize').Op.gte]: nuevaFechaFinal } }
                  ]
                }
              ]
            }
          });

          if (conflicto) {
            return res.status(400).json({
              success: false,
              message: 'El aula ya está ocupada en ese horario'
            });
          }
        }
      }

      await horario.update({
        fechaIni,
        fechaFinal,
        grupoMateriaId,
        aulaId
      });

      // Obtener el horario actualizado con las relaciones incluidas
      const horarioActualizado = await Horario.findByPk(id, {
        include: [
          {
            model: GrupoMateria,
            as: 'grupoMateria',
            attributes: ['id', 'numero', 'estado']
          },
          {
            model: Aula,
            as: 'aula',
            attributes: ['id', 'codigo', 'capacidad']
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Horario actualizado exitosamente',
        data: horarioActualizado
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

  // Obtener horarios por grupo de materia
  getByGrupoMateria: async (req, res) => {
    try {
      const { grupoMateriaId } = req.params;
      
      const grupoMateria = await GrupoMateria.findByPk(grupoMateriaId);
      if (!grupoMateria) {
        return res.status(404).json({
          success: false,
          message: 'Grupo de materia no encontrado'
        });
      }

      const horarios = await Horario.findAll({
        where: { grupoMateriaId },
        include: [{
          model: Aula,
          as: 'aula',
          attributes: ['id', 'codigo', 'capacidad']
        }],
        order: [['fechaIni', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: horarios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener horarios del grupo',
        error: error.message
      });
    }
  },

  // Obtener horarios por aula
  getByAula: async (req, res) => {
    try {
      const { aulaId } = req.params;
      
      const aula = await Aula.findByPk(aulaId);
      if (!aula) {
        return res.status(404).json({
          success: false,
          message: 'Aula no encontrada'
        });
      }

      const horarios = await Horario.findAll({
        where: { aulaId },
        include: [{
          model: GrupoMateria,
          as: 'grupoMateria',
          attributes: ['id', 'numero', 'estado']
        }],
        order: [['fechaIni', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: horarios
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener horarios del aula',
        error: error.message
      });
    }
  }
};

module.exports = horarioController;