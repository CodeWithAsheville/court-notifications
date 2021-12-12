const testData = require('./testdata.json');
console.log(testData);

exports.seed = async function(knex) {
  // Clear out all the tables
  await knex('cases').del();
  await knex('subscriptions').del();
  await knex('subscribers').del();
  await knex('defendants').del();

  // // Deletes ALL existing entries
  // return knex('table_name').del()
  //   .then(function () {
  //     // Inserts seed entries
  //     return knex('table_name').insert([
  //       {id: 1, colName: 'rowValue1'},
  //       {id: 2, colName: 'rowValue2'},
  //       {id: 3, colName: 'rowValue3'}
  //     ]);
  //   });
};
