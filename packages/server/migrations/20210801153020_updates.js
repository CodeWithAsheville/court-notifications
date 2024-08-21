/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema
    .createTable(`${schema}.records_to_update`, (table) => {
      table.integer('defendant_id');
      table.integer('done').defaultTo(0);
    });
};

exports.down = async function (knex) {
  return knex.schema.dropTable(`${schema}.records_to_update`);
};
