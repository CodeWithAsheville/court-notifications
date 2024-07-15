/* eslint-disable func-names */
exports.up = async function (knex) {
  const msg = `
    The Buncombe County Court System will transition to a new electronic record-keeping system July 22. Court Reminders will return on July 23.
    
    El sistema judicial del condado de Buncombe hará la transición a un nuevo sistema de mantenimiento de registros electrónicos el 22 de julio. Los recordatoriosorios judiciales volverán el 23 de julio.

    Судебная система округа Банкомб перейдет на новую электронную систему ведения документации 22 июля. Уведомления о судебных слушаниях вернутся 23 июля.
  `;
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.text('detail').defaultTo('-');
  });
  await knex('cn_configuration').insert([
    { name: 'maintenance_mode', value: '0', detail: 'This is a test maintenance message.' },
  ]);
};

exports.down = async function (knex) {
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.dropColumn('detail');
  });
};
