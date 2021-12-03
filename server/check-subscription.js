const url = require('url');
const knexConfig = require('../knexfile');
var knex        = require('knex')(knexConfig);
const { logger } = require('./scripts/logger');

async function checkSubscription(req, callback) {
  console.log('In checkSubscription');
  let status = 'pending';
  try {
    console.log('URL: ' + req.url);
    const queryObject = url.parse(req.url, true).query;
    logger.debug('Checking subscription status for index ' + JSON.stringify(queryObject));
    const index = queryObject.index;
    console.log('Index = ' + index);
    let subscribers = await knex('subscribers').select().where({
      id: index
    });
    if (subscribers.length <= 0) {
      status = 'failed';
    }
    else {
      status = subscribers[0].status;
    }
  }
  catch (e) {
    console.log('Error ' + e);
  }
  callback({code: 200, status });
}
module.exports = {
  checkSubscription
}