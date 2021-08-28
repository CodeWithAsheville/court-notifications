const knexConfig = require('../knexfile');
var knex        = require('knex')(knexConfig);

async function readyToNotify(notificationDays) {
  let dateClause = 'court_date - CURRENT_DATE = ' + notificationDays

  return await knex('cases')
    .select('defendant_id', 'case_number', 'court_date', 'room', knex.raw('court_date - CURRENT_DATE as age'))
    .whereRaw(dateClause)
  .then(results => {
    console.log(results)
  })
}

async function notify(body, callback, onError) {  
  let returnMessage = 'Successfully subscribed';

  try {
    // code here
  }
  catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
  }

  callback({message: returnMessage});
}
module.exports = {
  notify
}

readyToNotify(18)

