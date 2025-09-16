// controllers_sync/docenteControllerSync.js
// VERSIÓN 100% SÍNCRONA (BLOQUEANTE) USANDO DEASYNC - NO USAR EN PRODUCCIÓN

const { Docente, GrupoMateria, Materia } = require('../models');
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

const docenteControllerSync = {
  // Obtener todos los docentes
  getAll: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const docentes = makeSync(() => Docente.findAndCountAll({
        include: [{
          model: GrupoMateria,
          as: 'grupos',
          attributes: ['id', 'grupo', 'estado'],
          include: [{ model: Materia, as: 'materia', attributes: ['id', 'nombre', 'sigla', 'creditos'] }]
        }],
        order: [['id', 'ASC']]
      }));

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
      res.status(500).json({ success: false, message: 'Error al obtener docentes', error: error.message });
    }
  },

  // Obtener docente por ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const docente = makeSync(() => Docente.findByPk(id, {
        include: [{
          model: GrupoMateria,
          as: 'grupos',
          attributes: ['id', 'grupo', 'estado'],
          include: [{ model: Materia, as: 'materia', attributes: ['id', 'nombre', 'sigla', 'creditos'] }]
        }]
      }));

      if (!docente) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }
      res.status(200).json({ success: true, data: docente });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener docente', error: error.message });
    }
  },

  // Crear nuevo docente
  create: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }

      const { nombre, telefono } = req.body;
      const docente = makeSync(() => Docente.create({ nombre, telefono }));

      res.status(201).json({ success: true, message: 'Docente creado exitosamente', data: docente });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear docente', error: error.message });
    }
  },

  // Actualizar docente
  update: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
      const { id } = req.params;
      const { nombre, telefono } = req.body;

      const docente = makeSync(() => Docente.findByPk(id));
      if (!docente) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      const updatedDocente = makeSync(() => docente.update({ nombre, telefono }));

      res.status(200).json({ success: true, message: 'Docente actualizado exitosamente', data: updatedDocente });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar docente', error: error.message });
    }
  },

  // Eliminar docente
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const docente = makeSync(() => Docente.findByPk(id));
      if (!docente) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      makeSync(() => docente.destroy());

      res.status(200).json({ success: true, message: 'Docente eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar docente', error: error.message });
    }
  },

  // Actualización parcial con PATCH
  patch: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
      const { id } = req.params;
      const updateData = req.body;

      const docente = makeSync(() => Docente.findByPk(id));
      if (!docente) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      const updatedDocente = makeSync(() => docente.update(updateData));

      res.status(200).json({ success: true, message: 'Docente actualizado parcialmente', data: updatedDocente });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar docente', error: error.message });
    }
  }
};

module.exports = docenteControllerSync;