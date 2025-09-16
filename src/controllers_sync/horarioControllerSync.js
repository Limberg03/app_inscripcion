// controllers_sync/horarioControllerSync.js
// VERSIÓN 100% SÍNCRONA (BLOQUEANTE) USANDO DEASYNC - NO USAR EN PRODUCCIÓN

const { Horario } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const deasync = require('deasync');

// Función auxiliar para convertir una función que retorna una promesa en síncrona
const makeSync = (promiseFn) => {
  let result, error, done = false;
  promiseFn()
    .then(res => { result = res; })
    .catch(err => { error = err; })
    .finally(() => { done = true; });
  deasync.loopWhile(() => !done); // Bucle bloqueante
  if (error) throw error;
  return result;
};

const horarioControllerSync = {
  // Obtener todos los horarios
  getAll: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const horarios = makeSync(() => Horario.findAndCountAll({
        order: [['dia', 'ASC'], ['horaInicio', 'ASC']]
      }));

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
      res.status(500).json({ success: false, message: 'Error al obtener horarios', error: error.message });
    }
  },

  // Obtener horario por ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const horario = makeSync(() => Horario.findByPk(id));

      if (!horario) {
        return res.status(404).json({ success: false, message: 'Horario no encontrado' });
      }
      res.status(200).json({ success: true, data: horario });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener horario', error: error.message });
    }
  },

  // Crear nuevo horario
  create: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }

      const { dia, horaInicio, horaFin } = req.body;

      const conflicto = makeSync(() => Horario.findOne({
        where: {
          dia,
          [Op.or]: [
            { horaInicio: { [Op.between]: [horaInicio, horaFin] } },
            { horaFin: { [Op.between]: [horaInicio, horaFin] } },
            { [Op.and]: [{ horaInicio: { [Op.lte]: horaInicio } }, { horaFin: { [Op.gte]: horaFin } }] }
          ]
        }
      }));

      if (conflicto) {
        return res.status(400).json({ success: false, message: 'Ya existe un horario que se superpone en ese día y horario' });
      }

      const horario = makeSync(() => Horario.create({ dia, horaInicio, horaFin }));

      res.status(201).json({ success: true, message: 'Horario creado exitosamente', data: horario });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear horario', error: error.message });
    }
  },

  // Actualizar horario
  update: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }

      const { id } = req.params;
      const { dia, horaInicio, horaFin } = req.body;

      const horarioInstance = makeSync(() => Horario.findByPk(id));
      if (!horarioInstance) {
        return res.status(404).json({ success: false, message: 'Horario no encontrado' });
      }

      const conflicto = makeSync(() => Horario.findOne({
        where: {
          id: { [Op.ne]: id },
          dia,
          [Op.or]: [
            { horaInicio: { [Op.between]: [horaInicio, horaFin] } },
            { horaFin: { [Op.between]: [horaInicio, horaFin] } },
            { [Op.and]: [{ horaInicio: { [Op.lte]: horaInicio } }, { horaFin: { [Op.gte]: horaFin } }] }
          ]
        }
      }));

      if (conflicto) {
        return res.status(400).json({ success: false, message: 'Ya existe un horario que se superpone en ese día y horario' });
      }

      const updatedHorario = makeSync(() => horarioInstance.update({ dia, horaInicio, horaFin }));

      res.status(200).json({ success: true, message: 'Horario actualizado exitosamente', data: updatedHorario });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar horario', error: error.message });
    }
  },

  // Eliminar horario
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const horario = makeSync(() => Horario.findByPk(id));
      if (!horario) {
        return res.status(404).json({ success: false, message: 'Horario no encontrado' });
      }

      makeSync(() => horario.destroy());

      res.status(200).json({ success: true, message: 'Horario eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar horario', error: error.message });
    }
  },
};

module.exports = horarioControllerSync;