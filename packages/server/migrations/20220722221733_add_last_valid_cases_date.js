exports.up = async function(knex) {
  await knex.schema.alterTable('defendants', table => {
    table.date('last_valid_cases_date')
  });
};

exports.down = async function(knex) {
  await knex.schema.table('defendants', table => {
    table.dropColumn('last_valid_cases_date');
  });
};
