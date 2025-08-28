'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('estudiantes', [
      {
        numero: 'EST001',
        registro: 'Juan Pérez García',
        telefono: '77123456',
        fecha_nac: new Date('1999-05-15'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        numero: 'EST002',
        registro: 'María González López',
        telefono: '78987654',
        fecha_nac: new Date('2000-08-22'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        numero: 'EST003',
        registro: 'Carlos Ramírez Silva',
        telefono: '79456123',
        fecha_nac: new Date('1998-12-10'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        numero: 'EST004',
        registro: 'Ana Rodríguez Mamani',
        telefono: '76789012',
        fecha_nac: new Date('2001-03-18'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        numero: 'EST005',
        registro: 'Luis Fernando Choque',
        telefono: '75345678',
        fecha_nac: new Date('1999-09-05'),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('estudiantes', null, {});
  }
};