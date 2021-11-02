
exports.up = async function(knex) {
  await knex.schema.createTable('log_subscriptions', function (table) {
    table.string('first_name');
    table.string('middle_name');
    table.string('last_name');
    table.string('suffix');
    table.string('birth_date');
    table.text('cases');
    table.timestamps(false, true);
  })
  .createTable('log_notifications', function (table) {
    table.string('tag');
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

exports.down = function(knex) {
  return knex.schema.dropTable('log_subscriptions')
  .dropTable('log_notifications');
};
