
exports.up = async function(knex) {
  await knex.schema
  .createTable('notify_configuration', function (table) {
    table.integer('days_before');
    table.string('key');
  });
  await knex('notify_configuration').insert([
    { days_before: 7, key: 'notifications.reminder1' }
  ])
  await knex('notify_configuration').insert([
    { days_before: 2, key: 'notifications.reminder2' }
  ])
};

exports.down = async function(knex) {
  return knex.schema.dropTable('notify_configuration');
};
