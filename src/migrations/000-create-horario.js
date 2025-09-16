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
      // fecha: {
      //   type: Sequelize.DATE,
      //   allowNull: false
      // },
       dia: {
        type: Sequelize.STRING(100),
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
    await queryInterface.addIndex('horarios', ['dia']);
    await queryInterface.addIndex('horarios', ['hora_inicio']);
    await queryInterface.addIndex('horarios', ['hora_fin']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('horarios');
  }
};