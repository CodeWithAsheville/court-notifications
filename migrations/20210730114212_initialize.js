
exports.up = function(knex) {
  return knex.schema.createTable('subscribers', function (table) {
    table.increments();
    table.string('phone');
    table.datetime('next_notify')
    table.timestamps();
  })
  .createTable('defendants', function (table) {
    table.increments();
    table.string('first_name');
    table.string('middle_name');
    table.string('last_name');
    table.string('suffix');
    table.string('birth_date');
    table.timestamps();
  })
  .createTable('subscriptions', function (table) {
    table.integer('subscriber_id');
    table.integer('defendant_id');
    table.timestamps();
  })
  .createTable('cases', function(table) {
    table.integer('defendant_id');
    table.string('case_number');
    table.datetime('court_date');
    table.string('court');
    table.string('room');
    table.string('session');
    table.timestamps();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('subscribers')
  .dropTable('defendants')
  .dropTable('subscriptions')
  .dropTable('cases');
};
