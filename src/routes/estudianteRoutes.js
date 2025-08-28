const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const validators = require('../validators');

// Obtener todos los estudiantes
router.get('/', estudianteController.getAll);

// Obtener estudiante por ID
router.get('/:id', validators.common.idParam, estudianteController.getById);

// Crear nuevo estudiante
router.post('/', validators.estudiante.create, estudianteController.create);

// Actualizar estudiante
router.put('/:id', validators.estudiante.update, estudianteController.update);

// Eliminar estudiante
router.delete('/:id', validators.common.idParam, estudianteController.delete);

module.exports = router;