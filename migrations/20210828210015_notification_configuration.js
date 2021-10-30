
exports.up = async function(knex) {
  await knex.schema
  .createTable('notify_configuration', function (table) {
    table.integer('days_before');
    table.string('key');
    table.string('text');
  });
  await knex('notify_configuration').insert([
    { days_before: 6, key: 'notifications.reminder1', text: 'This is a reminder that {{name}} must be at the Buncombe County courthouse on {{date}} for the following cases:' }
  ])
  await knex('notify_configuration').insert([
    { days_before: 2, key: 'notifications.reminder2', text: 'This is a 2nd reminder that {{name}} must be at the Buncombe County courthouse on {{date}} for the following cases:' }
  ])
};

exports.down = async function(knex) {
  return await knex.schema.dropTable('notify_configuration');
};
