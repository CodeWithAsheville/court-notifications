exports.up = async function(knex) {
  await knex.schema.alterTable('subscribers', table => {
    table.date('last_valid_cases_date')
  });
};

exports.down = async function(knex) {
  await knex.schema.table('subscribers', table => {
    table.dropColumn('last_valid_cases_date');
  });
};
