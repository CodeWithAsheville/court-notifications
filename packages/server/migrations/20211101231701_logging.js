/* eslint-disable func-names */
const schema = process.env.DB_SCHEMA;

exports.up = async function (knex) {
  await knex.schema.createTable(`${schema}.log_subscriptions`, (table) => {
    table.string('first_name');
    table.string('middle_name');
    table.string('last_name');
    table.string('suffix');
    table.string('birth_date');
    table.text('cases');
    table.timestamps(false, true);
  })
    .createTable(`${schema}.log_notifications`, (table) => {
      table.string('tag');
      table.integer('days_before');
      table.string('first_name');
      table.string('middle_name');
      table.string('last_name');
      table.string('suffix');
      table.string('birth_date');
      table.integer('admin_count').defaultTo(0);
      table.integer('district_count').defaultTo(0);
      table.integer('superior_count').defaultTo(0);
      table.text('cases');
      table.timestamps(false, true);
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable(`${schema}.log_subscriptions`)
    .dropTable(`${schema}.log_notifications`);
};
