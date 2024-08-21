/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.table(`${schema}.log_notifications`, (table) => {
    table.renameColumn('cases', 'case_number');
  });

  await knex.schema.table(`${schema}.log_subscriptions`, (table) => {
    table.renameColumn('cases', 'case_number');
  });

  await knex.schema.alterTable(`${schema}.log_subscriptions`, (table) => {
    table.string('language');
    table.string('court');
    table.string('room');
  });

  await knex.schema.alterTable(`${schema}.log_notifications`, (table) => {
    table.string('language');
    table.string('court');
    table.string('room');
  });
};

exports.down = async function (knex) {
  await knex.schema.table(`${schema}.log_notifications`, (table) => {
    table.renameColumn('case_number', 'cases');
    table.dropColumn('language');
    table.dropColumn('court');
    table.dropColumn('room');
  });

  await knex.schema.table(`${schema}.log_subscriptions`, (table) => {
    table.renameColumn('case_number', 'cases');
    table.dropColumn('language');
    table.dropColumn('court');
    table.dropColumn('room');
  });
};
