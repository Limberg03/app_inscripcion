// controllers_sync/aulaControllerSync.js
// VERSIÓN 100% SÍNCRONA (BLOQUEANTE) USANDO DEASYNC - NO USAR EN PRODUCCIÓN

const { Aula } = require('../models');
const { validationResult } = require('express-validator');
const deasync = require('deasync');

// Función auxiliar para convertir una función que retorna una promesa en síncrona
const makeSync = (promiseFn) => {
  let result, error, done = false;
  promiseFn()
    .then(res => { result = res; })
    .catch(err => { error = err; })
    .finally(() => { done = true; });
  deasync.loopWhile(() => !done); // Bucle bloqueante hasta que la promesa se resuelva
  if (error) throw error;
  return result;
};

const aulaControllerSync = {
  // Obtener todas las aulas
  getAll: (req, res) => {
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

      const aulas = makeSync(() => Aula.findAndCountAll({ where, order: [['nombre', 'ASC']] }));

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
      res.status(500).json({ success: false, message: 'Error al obtener aulas', error: error.message });
    }
  },

  // Obtener aula por ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const aula = makeSync(() => Aula.findByPk(id));

      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }
      res.status(200).json({ success: true, data: aula });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener aula', error: error.message });
    }
  },

  // Crear nueva aula
  create: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }

      const { nombre, capacidad, estado } = req.body;
      const aula = makeSync(() => Aula.create({
        nombre,
        capacidad,
        estado: estado !== undefined ? estado : true
      }));

      res.status(201).json({ success: true, message: 'Aula creada exitosamente', data: aula });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al crear aula', error: error.message });
    }
  },

  // Actualizar aula
  update: (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, capacidad, estado } = req.body;

      const aula = makeSync(() => Aula.findByPk(id));
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      makeSync(() => aula.update({ nombre, capacidad, estado }));

      res.status(200).json({ success: true, message: 'Aula actualizada exitosamente', data: aula });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al actualizar aula', error: error.message });
    }
  },

  // Eliminar aula
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const aula = makeSync(() => Aula.findByPk(id));
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      makeSync(() => aula.destroy());

      res.status(200).json({ success: true, message: 'Aula eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar aula', error: error.message });
    }
  },

  // Actualización parcial con PATCH
  patch: (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const aula = makeSync(() => Aula.findByPk(id));
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      makeSync(() => aula.update(updateData));

      res.status(200).json({ success: true, message: 'Aula actualizada parcialmente', data: aula });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'El código de aula ya existe' });
      }
      res.status(500).json({ success: false, message: 'Error al actualizar aula', error: error.message });
    }
  },

  // Obtener aulas disponibles
  getAvailable: (req, res) => {
    try {
      const { capacidadMin } = req.query;
      const where = { estado: true };
      if (capacidadMin) {
        where.capacidad = { [require('sequelize').Op.gte]: parseInt(capacidadMin) };
      }

      const aulas = makeSync(() => Aula.findAll({ where, order: [['capacidad', 'ASC'], ['nombre', 'ASC']] }));

      res.status(200).json({ success: true, data: aulas });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener aulas disponibles', error: error.message });
    }
  }
};

module.exports = aulaControllerSync;