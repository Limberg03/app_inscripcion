'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper para obtener grupos de materia existentes
    const getGruposMateria = async () => {
      const result = await queryInterface.sequelize.query(
        'SELECT id, numero, materia_id FROM grupos_materia ORDER BY id',
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (result.length === 0) {
        throw new Error('No se encontraron grupos de materia en la base de datos');
      }
      return result;
    };

    // Helper para obtener aulas existentes
    const getAulas = async () => {
      const result = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM aulas ORDER BY id',
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (result.length === 0) {
        throw new Error('No se encontraron aulas en la base de datos');
      }
      return result;
    };

    // Obtener grupos de materia y aulas existentes
    const gruposMateria = await getGruposMateria();
    const aulas = await getAulas();

    await queryInterface.bulkInsert('horarios', [
      // Matemáticas I - Grupo A
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        grupo_materia_id: gruposMateria[0].id, // Primer grupo (Matemáticas I - Grupo A)
        aula_id: aulas[0].id, // Primera aula
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        fecha: new Date('2024-03-03'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        grupo_materia_id: gruposMateria[0].id, // Primer grupo (Matemáticas I - Grupo A)
        aula_id: aulas[0].id, // Primera aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // Matemáticas I - Grupo B
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '10:00:00',
        hora_fin: '12:00:00',
        grupo_materia_id: gruposMateria[1].id, // Segundo grupo (Matemáticas I - Grupo B)
        aula_id: aulas[1].id, // Segunda aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // Programación I - Grupo A
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        grupo_materia_id: gruposMateria[2].id, // Tercer grupo (Introducción a la Programación - Grupo A)
        aula_id: aulas[4].id, // Quinta aula
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        fecha: new Date('2024-03-04'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        grupo_materia_id: gruposMateria[2].id, // Tercer grupo (Introducción a la Programación - Grupo A)
        aula_id: aulas[4].id, // Quinta aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // Programación I - Grupo B
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '16:00:00',
        hora_fin: '18:00:00',
        grupo_materia_id: gruposMateria[3].id, // Cuarto grupo (Introducción a la Programación - Grupo B)
        aula_id: aulas[5].id, // Sexta aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // Física I - Grupo A
      {
        fecha: new Date('2024-03-05'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        grupo_materia_id: gruposMateria[4].id, // Quinto grupo (Física I - Grupo A)
        aula_id: aulas[2].id, // Tercera aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // POO - Grupo A
      {
        fecha: new Date('2024-03-01'),
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        grupo_materia_id: gruposMateria[6].id, // Séptimo grupo (POO - Grupo A)
        aula_id: aulas[4].id, // Quinta aula
        created_at: new Date(),
        updated_at: new Date()
      },
      // Estructura de Datos - Grupo A
      {
        fecha: new Date('2024-03-02'),
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        grupo_materia_id: gruposMateria[7].id, // Octavo grupo (Estructura de Datos - Grupo A)
        aula_id: aulas[5].id, // Sexta aula
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('horarios', null, {});
  }
};