const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionController');
const validators = require('../validators');

// Obtener todas las inscripciones
router.get('/', inscripcionController.getAll);

// Obtener inscripción por ID
router.get('/:id', validators.common.idParam, inscripcionController.getById);

// Crear nueva inscripción
router.post('/', validators.inscripcion.create, inscripcionController.create);

// Actualizar inscripción
router.put('/:id', validators.inscripcion.update, inscripcionController.update);

// Eliminar inscripción
router.delete('/:id', validators.common.idParam, inscripcionController.delete);

// Obtener inscripciones por estudiante
router.get('/estudiante/:estudianteId', validators.common.idParam, inscripcionController.getByEstudiante);

module.exports = router;