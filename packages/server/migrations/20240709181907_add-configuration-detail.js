/* eslint-disable func-names */
exports.up = async function (knex) {
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
