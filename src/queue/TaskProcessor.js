const { sequelize } = require('../models');

class TaskProcessor {
  constructor() {
    this.models = null;
  }

  async initialize() {
    this.models = sequelize.models;
    console.log('✅ TaskProcessor inicializado con modelos:', Object.keys(this.models));
  }

  async processTask(task) {
    console.log(`🔧 Procesando tarea: ${task.id}`);
    console.log(`   Modelo: ${task.model}`);
    console.log(`   Operación: ${task.operation}`);
    
    const { model, operation, data, id } = task;
    
    const Model = this.models[model];
    if (!Model) {
      throw new Error(`Modelo ${model} no encontrado`);
    }

    let result;

    try {
      switch (operation) {
        case 'create':
          result = await this.handleCreate(Model, data);
          break;
          
        case 'update':
          result = await this.handleUpdate(Model, id, data);
          break;
          
        case 'delete':
          result = await this.handleDelete(Model, id);
          break;
          
        case 'bulkCreate':
          result = await this.handleBulkCreate(Model, data);
          break;
          
        case 'bulkUpdate':
          result = await this.handleBulkUpdate(Model, data);
          break;
          
        case 'bulkDelete':
          result = await this.handleBulkDelete(Model, data);
          break;
          
        default:
          throw new Error(`Operación ${operation} no soportada`);
      }

      console.log(`✅ Tarea ${task.id} completada exitosamente`);
      return {
        success: true,
        operation,
        model,
        result
      };

    } catch (error) {
      console.error(`❌ Error procesando tarea ${task.id}:`, error);
      throw {
        message: error.message,
        retry: this.shouldRetry(error)
      };
    }
  }

  async handleCreate(Model, data) {
    const record = await Model.create(data);
    return {
      id: record.id,
      created: true,
      data: record.toJSON()
    };
  }

  async handleUpdate(Model, id, data) {
    const [updated, records] = await Model.update(data, {
      where: { id },
      returning: true
    });
    
    if (updated === 0) {
      throw new Error(`Registro con id ${id} no encontrado`);
    }
    
    return {
      id,
      updated: true,
      data: records[0]?.toJSON()
    };
  }

  async handleDelete(Model, id) {
    const deleted = await Model.destroy({
      where: { id }
    });
    
    if (deleted === 0) {
      throw new Error(`Registro con id ${id} no encontrado`);
    }
    
    return {
      id,
      deleted: true
    };
  }

  async handleBulkCreate(Model, records) {
    const created = await Model.bulkCreate(records, {
      validate: true,
      returning: true
    });
    
    return {
      created: created.length,
      records: created.map(r => r.toJSON())
    };
  }

  async handleBulkUpdate(Model, { where, data }) {
    const [updated] = await Model.update(data, {
      where,
      returning: false
    });
    
    return {
      updated,
      where,
      data
    };
  }

  async handleBulkDelete(Model, { where }) {
    const deleted = await Model.destroy({
      where
    });
    
    return {
      deleted,
      where
    };
  }

  shouldRetry(error) {
    // Determinar si el error es recuperable
    const retryableErrors = [
      'SequelizeConnectionError',
      'SequelizeConnectionTimedOutError',
      'SequelizeHostNotReachableError',
      'SequelizeConnectionRefusedError'
    ];
    
    return retryableErrors.includes(error.name) || 
           error.message.includes('connection') ||
           error.message.includes('timeout');
  }
}

module.exports = TaskProcessor;