const knexConfig = require('../knexfile');
var knex        = require('knex')(knexConfig);
const { logger } = require('./scripts/logger');

async function checkSubscription(req, callback) {
  let status = 'pending';
  const body = req.body;
  logger.debug('Checking subscription status for index ' + body.index);
  let subscribers = await knex('subscribers').select().where({
    id: body.index
  });
  if (subscribers.length <= 0) {
    status = 'failed';
  }
  else {
    status = subscribers[0].status;
  }
  callback({code: 200, status });
}
module.exports = {
  checkSubscription
}