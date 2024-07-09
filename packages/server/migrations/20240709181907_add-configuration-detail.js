/* eslint-disable func-names */
exports.up = async function (knex) {
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.text('detail').defaultTo('-');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('cn_configuration', (table) => {
    table.dropColumn('detail');
  });
};
