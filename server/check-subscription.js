const url = require('url');
const { knex } = require('./util/db');
const { logger } = require('./util/logger');

const twilioErrorCodes = {
  '30003': 'Unreachable destination handset',
  '30004': 'Message blocked',
  '30005': 'Unknown destination handset',
  '30006': 'Landline or unreachable carrier',
  '30008': 'Unknown error'
};

async function checkSubscription(req, callback) {
  let status = 'pending';
  let errormessage = '';
  try {
    const queryObject = url.parse(req.url, true).query;
    logger.debug('Checking subscription status for index ' + JSON.stringify(queryObject));
    const index = queryObject.index;
    let subscribers = await knex('subscribers').select().where({
      id: index
    });
    if (subscribers.length <= 0) {
      status = 'failed';
      errormessage = 'Unknown error'
    }
    else {
      status = subscribers[0].status;
      if (status === 'failed') {
        errormessage = 'Unknown error'
        if (subscribers[0].errorcode in twilioErrorCodes) {
          errormessage = twilioErrorCodes[subscribers[0].errorcode];
        }  
      }
    }
  }
  catch (e) {
    logger.error('Error in checkSubscription: ' + e);
  }
  callback({code: 200, status, errormessage });
}
module.exports = {
  checkSubscription
}