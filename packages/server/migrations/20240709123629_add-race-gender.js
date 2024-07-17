/* eslint-disable func-names */
exports.up = async function (knex) {
  await knex.schema.alterTable('defendants', (table) => {
    table.string('sex').defaultTo('-');
    table.string('race').defaultTo('-');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('defendants', (table) => {
    table.dropColumn('sex');
    table.dropColumn('race');
  });
};
