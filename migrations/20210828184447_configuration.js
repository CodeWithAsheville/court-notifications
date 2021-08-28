
exports.up = async function(knex) {
  await knex.schema
  .createTable('cn_configuration', function (table) {
    table.string('name');
    table.string('type');
    table.string('value');
  });
};

exports.down = async function(knex) {
  return await knex.schema.dropTable('cn_configuration');
};
