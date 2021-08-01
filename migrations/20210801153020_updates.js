
exports.up = async function(knex) {
  await knex.schema
  .createTable('updates', function (table) {
    table.integer('defendant_id');
    table.integer('done').defaultTo(0);
  })
  .createTable('update-configuration', function(table) {
    table.integer('updates_per_hour');
    table.integer('updates_per_minute');
  });
};

exports.down = async function(knex) {
  return await knex.schema.dropTable('updates')
  .dropTable('update-configuration');
};
