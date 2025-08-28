'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('horarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false
      },
      grupo_materia_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'grupos_materia',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      aula_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'aulas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // Crear índices
    await queryInterface.addIndex('horarios', ['fecha']);
    await queryInterface.addIndex('horarios', ['grupo_materia_id']);
    await queryInterface.addIndex('horarios', ['aula_id']);
    await queryInterface.addIndex('horarios', ['hora_inicio']);
    await queryInterface.addIndex('horarios', ['hora_fin']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('horarios');
  }
};