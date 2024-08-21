/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.alterTable(`${schema}.defendants`, (table) => {
    table.integer('flag').defaultTo(0);
  });
  await knex.schema.alterTable(`${schema}.subscribers`, (table) => {
    table.integer('flag').defaultTo(0);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(`${schema}.defendants`, (table) => {
    table.dropColumn('flag');
  });
  await knex.schema.alterTable(`${schema}.subscribers`, (table) => {
    table.dropColumn('flag');
  });
};
