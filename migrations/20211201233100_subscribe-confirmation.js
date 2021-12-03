
exports.up = async function(knex) {
  await knex.schema.alterTable('subscribers', table => {
    table.string('status').defaultTo('confirmed');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('subscribers', table => {
    table.dropColumn('status');
  });
};
