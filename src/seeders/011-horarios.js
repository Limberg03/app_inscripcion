'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    

    await queryInterface.bulkInsert('horarios', [
      // Matemáticas I - Grupo A
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        fecha: new Date('2024-03-03'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Matemáticas I - Grupo B
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '10:00:00',
        hora_fin: '12:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Programación I - Grupo A
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        fecha: new Date('2024-03-04'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Programación I - Grupo B
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '16:00:00',
        hora_fin: '18:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Física I - Grupo A
      {
        fecha: new Date('2024-03-05'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // POO - Grupo A
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        created_at: new Date(),
        updated_at: new Date()
      },
      // Estructura de Datos - Grupo A
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('horarios', null, {});
  }
};