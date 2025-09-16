// controllers_sync/nivelControllerSync.js
// VERSIÓN 100% SÍNCRONA (BLOQUEANTE) USANDO DEASYNC - NO USAR EN PRODUCCIÓN

const { Nivel, Materia } = require('../models');
const { validationResult } = require('express-validator');
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

const nivelControllerSync = {
  // Obtener todos los niveles
  getAll: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const niveles = makeSync(() => Nivel.findAndCountAll({
        include: [{ model: Materia, as: 'materias', attributes: ['id', 'nombre', 'sigla', 'creditos'] }],
        order: [['id', 'ASC']]
      }));

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
      res.status(500).json({ success: false, message: 'Error al obtener niveles', error: error.message });
    }
  },

  // Obtener nivel por ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const nivel = makeSync(() => Nivel.findByPk(id, {
        include: [{ model: Materia, as: 'materias', attributes: ['id', 'nombre', 'sigla', 'creditos'] }]
      }));

      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }
      res.status(200).json({ success: true, data: nivel });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener nivel', error: error.message });
    }
  },

  // Crear nuevo nivel
  create: (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
      }
      const { nombre, materias } = req.body;

      const nivel = makeSync(() => Nivel.create({ nombre }));

      if (materias && Array.isArray(materias)) {
        // En lugar de Promise.all, iteramos y creamos cada materia de forma síncrona
        for (const materia of materias) {
          makeSync(() => Materia.create({
            nombre: materia.nombre,
            sigla: materia.sigla,
            creditos: materia.creditos,
            nivelId: nivel.id,
            planEstudioId: materia.planEstudioId
          }));
        }
      }

      const nivelConMaterias = makeSync(() => Nivel.findByPk(nivel.id, {
        include: [{ model: Materia, as: 'materias' }]
      }));

      res.status(201).json({ success: true, message: 'Nivel creado exitosamente', data: nivelConMaterias });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear nivel', error: error.message });
    }
  },

  // Actualizar nivel
  update: (req, res) => {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      const nivel = makeSync(() => Nivel.findByPk(id));
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      const updatedNivel = makeSync(() => nivel.update({ nombre }));

      res.status(200).json({ success: true, message: 'Nivel actualizado exitosamente', data: updatedNivel });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar nivel', error: error.message });
    }
  },

  // Actualización parcial con PATCH
  patch: (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const nivel = makeSync(() => Nivel.findByPk(id));
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      const updatedNivel = makeSync(() => nivel.update(updateData));

      res.status(200).json({ success: true, message: 'Nivel actualizado parcialmente', data: updatedNivel });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar nivel', error: error.message });
    }
  },

  // Eliminar nivel
  delete: (req, res) => {
    try {
      const { id } = req.params;
      const nivel = makeSync(() => Nivel.findByPk(id));
      if (!nivel) {
        return res.status(404).json({ success: false, message: 'Nivel no encontrado' });
      }

      makeSync(() => nivel.destroy());

      res.status(200).json({ success: true, message: 'Nivel eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al eliminar nivel', error: error.message });
    }
  }
};

module.exports = nivelControllerSync;