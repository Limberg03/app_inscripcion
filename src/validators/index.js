const { body, param } = require('express-validator');

const validators = {
  // Validadores para Estudiante
  estudiante: {
    create: [
      body('numero')
        .notEmpty()
        .withMessage('El número de estudiante es requerido')
        .isLength({ max: 20 })
        .withMessage('El número no puede exceder 20 caracteres'),
      
      body('registro')
        .notEmpty()
        .withMessage('El registro (nombre) es requerido')
        .isLength({ max: 50 })
        .withMessage('El registro no puede exceder 50 caracteres'),
      
      body('telefono')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El teléfono no puede exceder 20 caracteres'),
      
      body('fechaNac')
        .optional()
        .isISO8601()
        .withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
    ],

    update: [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),
      
      body('numero')
        .notEmpty()
        .withMessage('El número de estudiante es requerido')
        .isLength({ max: 20 })
        .withMessage('El número no puede exceder 20 caracteres'),
      
      body('registro')
        .notEmpty()
        .withMessage('El registro (nombre) es requerido')
        .isLength({ max: 50 })
        .withMessage('El registro no puede exceder 50 caracteres'),
      
      body('telefono')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El teléfono no puede exceder 20 caracteres'),
      
      body('fechaNac')
        .optional()
        .isISO8601()
        .withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
    ]
  },

  // Validadores para Inscripción
  inscripcion: {
    create: [
      body('gestion')
        .isInt({ min: 2000, max: 2100 })
        .withMessage('La gestión debe ser un año válido entre 2000 y 2100'),
      
      body('estudianteId')
        .isInt({ min: 1 })
        .withMessage('El ID del estudiante debe ser un número entero positivo'),
      
      body('fecha')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)')
    ],

    update: [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo'),
      
      body('gestion')
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage('La gestión debe ser un año válido entre 2000 y 2100'),
      
      body('estudianteId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El ID del estudiante debe ser un número entero positivo'),
      
      body('fecha')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe tener formato válido (YYYY-MM-DD)')
    ]
  },
  carrera: {
  create: [
    body('nombre')
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    
    body('codigo')
      .notEmpty()
      .withMessage('El código es requerido')
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres'),
    
    body('modalidad')
      .notEmpty()
      .withMessage('La modalidad es requerida')
      .isIn(['presencial', 'virtual', 'semipresencial'])
      .withMessage('La modalidad debe ser: presencial, virtual o semipresencial'),
    
    body('estado')
      .optional()
      .isBoolean()
      .withMessage('El estado debe ser un valor booleano'),
    
    body('planEstudioId')
      .notEmpty()
      .withMessage('El ID del plan de estudio es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del plan de estudio debe ser un número entero positivo')
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID debe ser un número entero positivo'),
    
    body('nombre')
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    
    body('codigo')
      .notEmpty()
      .withMessage('El código es requerido')
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres'),
    
    body('modalidad')
      .notEmpty()
      .withMessage('La modalidad es requerida')
      .isIn(['presencial', 'virtual', 'semipresencial'])
      .withMessage('La modalidad debe ser: presencial, virtual o semipresencial'),
    
    body('estado')
      .optional()
      .isBoolean()
      .withMessage('El estado debe ser un valor booleano'),
    
    body('planEstudioId')
      .notEmpty()
      .withMessage('El ID del plan de estudio es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del plan de estudio debe ser un número entero positivo')
  ],

  patch: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID debe ser un número entero positivo'),
    
    body('nombre')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    
    body('codigo')
      .optional()
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres'),
    
    body('modalidad')
      .optional()
      .isIn(['presencial', 'virtual', 'semipresencial'])
      .withMessage('La modalidad debe ser: presencial, virtual o semipresencial'),
    
    body('estado')
      .optional()
      .isBoolean()
      .withMessage('El estado debe ser un valor booleano'),
    
    body('planEstudioId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID del plan de estudio debe ser un número entero positivo')
  ]
},

  // Validadores de parámetros comunes
  common: {
    idParam: [
      param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
    ]
  }
};

module.exports = validators;