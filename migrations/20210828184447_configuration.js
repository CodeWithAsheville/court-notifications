
exports.up = async function(knex) {
  await knex.schema
  .createTable('cn_configuration', function (table) {
    table.string('name');
    table.string('type');
    table.string('value');
  });
  await knex('cn_configuration').insert([
    { name: 'updates_per_call', value: '2' },
    { name: 'days_before_update', value: '-1' },
    { name: 'days_before_purge', value: '2' }
  ])
};

exports.down = async function(knex) {
  return await knex.schema.dropTable('cn_configuration');
};
