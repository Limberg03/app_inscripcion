'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inscripciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      gestion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 2000,
          max: 2100
        }
      },
      estudiante_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'estudiantes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear índices para mejorar el rendimiento
    await queryInterface.addIndex('inscripciones', ['estudiante_id']);
    await queryInterface.addIndex('inscripciones', ['gestion']);
    await queryInterface.addIndex('inscripciones', ['fecha']);
    
    // Índice compuesto para consultas por estudiante y gestión
    await queryInterface.addIndex('inscripciones', ['estudiante_id', 'gestion']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inscripciones');
  }
};