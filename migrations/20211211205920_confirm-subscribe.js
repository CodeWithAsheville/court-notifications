
exports.up = async function(knex) {
  await knex.schema.alterTable('subscribers', table => {
    table.string('status').defaultTo('confirmed');
    table.integer('failed').defaultTo(0);
    table.string('errorcode');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('subscribers', table => {
    table.dropColumn('status');
    table.dropColumn('failed');
    table.dropColumn('errorcode');
  });
};
