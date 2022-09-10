/* eslint-disable func-names */

exports.up = async function (knex) {
  await knex.schema.createTable('agencies', (table) => {
    table.increments();
    table.string('agency_name');
    table.integer('notification_day').defaultTo(0);
    table.timestamps(false, true);
  })
    .alterTable('subscribers', (table) => {
      table.string('agency');
    });
};

exports.down = async function (knex) {
  await knex.schema.table('subscribers', (table) => {
    table.dropColumn('agency');
  })
    .dropTable('agencies');
};
