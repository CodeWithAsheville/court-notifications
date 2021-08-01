

exports.up = async function(knex) {
  await knex.schema.createTable('subscribers', function (table) {
    table.increments();
    table.string('phone');
    table.date('next_notify')
    table.timestamps(false, true);
  })
  .createTable('defendants', function (table) {
    table.increments();
    table.string('long_id').unique().notNullable();
    table.string('first_name');
    table.string('middle_name');
    table.string('last_name');
    table.string('suffix');
    table.string('birth_date');
    table.integer('updates').defaultTo(0);
    table.timestamps(false, true);
  })
  .createTable('subscriptions', function (table) {
    table.integer('subscriber_id');
    table.integer('defendant_id');
    table.timestamps(false, true);
  })
  .createTable('cases', function(table) {
    table.increments();
    table.integer('defendant_id');
    table.string('case_number');
    table.date('court_date');
    table.string('court');
    table.string('room');
    table.string('session');
    table.timestamps(false, true);
  });

  const tables = ['subscribers', 'defendants', 'subscriptions', 'cases']
  for (let i=0; i < tables.length; ++i) {
    // See https://dev.to/morz/knex-psql-updating-timestamps-like-a-pro-2fg6
    let cmd = `
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE
      ON ${tables[i]}
      FOR EACH ROW
      EXECUTE PROCEDURE update_timestamp();
    `
    await knex.raw(cmd);
  }
};

exports.down = function(knex) {
  return knex.schema.dropTable('subscribers')
  .dropTable('defendants')
  .dropTable('subscriptions')
  .dropTable('cases');
};

