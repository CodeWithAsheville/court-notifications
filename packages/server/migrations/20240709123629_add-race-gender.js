/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.alterTable(`${schema}.defendants`, (table) => {
    table.string('sex').defaultTo('-');
    table.string('race').defaultTo('-');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(`${schema}.defendants`, (table) => {
    table.dropColumn('sex');
    table.dropColumn('race');
  });
};
