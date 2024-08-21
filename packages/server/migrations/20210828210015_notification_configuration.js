/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema
    .createTable(`${schema}.notify_configuration`, (table) => {
      table.integer('days_before');
      table.string('key');
    });
  await knex(`${schema}.notify_configuration`).insert([
    { days_before: 7, key: 'notifications.reminder1' },
  ]);
  await knex(`${schema}.notify_configuration`).insert([
    { days_before: 2, key: 'notifications.reminder2' },
  ]);
};

exports.down = async function (knex) {
  return knex.schema.dropTable(`${schema}.notify_configuration`);
};
