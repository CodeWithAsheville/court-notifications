/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.alterTable(`${schema}.defendants`, (table) => {
    table.date('last_valid_cases_date');
  });
};

exports.down = async function (knex) {
  await knex.schema.table(`${schema}.defendants`, (table) => {
    table.dropColumn('last_valid_cases_date');
  });
};
