/* eslint-disable func-names */
exports.up = async function (knex) {
  await knex.schema.alterTable('defendants', (table) => {
    table.integer('flag').defaultTo(0);
  });
  await knex.schema.alterTable('subscribers', (table) => {
    table.integer('flag').defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('defendants', (table) => {
    table.dropColumn('flag');
  });
  await knex.schema.alterTable('subscribers', (table) => {
    table.dropColumn('flag');
  });
};
