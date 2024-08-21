/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.createTable(`${schema}.log_updates`, (table) => {
    table.integer('id');
    table.string('long_id');
    table.date('last_valid_cases_date');
    table.integer('updates');
    table.timestamp('original_create_date');
    table.integer('new_case_count');
    table.integer('flag').defaultTo(0);
    table.timestamps(false, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable(`${schema}.log_updates`);
};
