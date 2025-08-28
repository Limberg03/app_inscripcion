const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Horario = sequelize.define('Horario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'hora_inicio'
  },
  horaFin: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'hora_fin'
  },
  grupoMateriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'grupo_materia_id',
    references: {
      model: 'grupos_materia',
      key: 'id'
    }
  },
  aulaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'aula_id',
    references: {
      model: 'aulas',
      key: 'id'
    }
  }
}, {
  tableName: 'horarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Horario;