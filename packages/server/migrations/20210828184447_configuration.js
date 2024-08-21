/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema
    .createTable(`${schema}.cn_configuration`, (table) => {
      table.string('name');
      table.string('type');
      table.string('value');
    });
  await knex(`${schema}.cn_configuration`).insert([
    { name: 'updates_per_call', value: '2' },
    { name: 'days_before_update', value: '-1' },
    { name: 'days_before_purge', value: '2' },
  ]);
};

exports.down = async function (knex) {
  return knex.schema.dropTable(`${schema}.cn_configuration`);
};
