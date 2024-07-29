/* eslint-disable func-names */
exports.up = async function (knex) {
  await knex.schema.createTable('log_updates', (table) => {
    table.integer('id');
    table.string('long_id');
    table.date('last_valid_cases_date');
    table.integer('updates');
    table.timestamp('original_create_date');
    table.integer('new_case_count');
    table.timestamps(false, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('log_updates')
    .dropTable('log_updates');
};
