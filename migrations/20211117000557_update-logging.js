
exports.up = async function(knex) {
  await knex.schema.table('log_notifications', table => {
    table.renameColumn('cases', 'case_number');
  });

  await knex.schema.table('log_subscriptions', table => {
    table.renameColumn('cases', 'case_number');
  });

  await knex.schema.alterTable('log_subscriptions', table => {
    table.string('language');
    table.string('court')
    table.string('room')
  });

  await knex.schema.alterTable('log_notifications', table => {
    table.string('language');
    table.string('court')
    table.string('room')
  });
};

exports.down = async function(knex) {
  await knex.schema.table('log_notifications', table => {
    table.renameColumn('case_number', 'cases');
    table.dropColumn('language');
    table.dropColumn('court');
    table.dropColumn('room');
  });

  await knex.schema.table('log_subscriptions', table => {
    table.renameColumn('case_number', 'cases');
    table.dropColumn('language');
    table.dropColumn('court');
    table.dropColumn('room');
  });

};
