/* eslint-disable func-names */
exports.up = async function (knex) {
  await knex.schema
    .createTable('records_to_update', (table) => {
      table.integer('defendant_id');
      table.integer('done').defaultTo(0);
    });
};

exports.down = async function (knex) {
  return knex.schema.dropTable('records_to_update');
};
