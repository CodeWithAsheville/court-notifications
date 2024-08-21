/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.alterTable(`${schema}.subscribers`, (table) => {
    table.string('status').defaultTo('confirmed');
    table.integer('failed').defaultTo(0);
    table.string('errorcode');
  });
};

exports.down = async function (knex) {
  await knex.schema.table(`${schema}.subscribers`, (table) => {
    table.dropColumn('status');
    table.dropColumn('failed');
    table.dropColumn('errorcode');
  });
};
