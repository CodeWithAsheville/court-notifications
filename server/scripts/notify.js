const knexConfig = require('../knexfile');
var env         = 'development';
var knex        = require('knex')(knexConfig[env]);

async function readyToNotify(notificationDays) {
  let dateClause = 'court_date - CURRENT_DATE = ' + notificationDays

  return await knex('cases')
    .select('defendant_id', 'case_number', 'court_date', 'room', knex.raw('court_date - CURRENT_DATE as age'))
    .whereRaw(dateClause)
  .then(results => {
    console.log(results)
  })
}

// readyToNotify(18)


// 
(async() => {
  console.log('Call updateDefendants');
  await updateDefendants('2021-08-09', -1);
  console.log('Done with update');
  process.exit();
})();


