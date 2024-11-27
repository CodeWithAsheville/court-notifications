/* eslint-disable func-names */

exports.up = async function (knex) {
  await knex.schema.createTable('log_unsubscribes', (table) => {
    table.string('phone4');
    table.string('long_id');
    table.date('last_valid_cases_date');
    table.timestamp('original_subscribe_date');
    table.timestamps(false, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('log_unsubscribes');
};
