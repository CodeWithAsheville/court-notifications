const url = require('url');
const { getClient } = require('./util/db');
const { logger } = require('./util/logger');

const twilioErrorCodes = {
  30003: 'Unreachable destination handset',
  30004: 'Message blocked',
  30005: 'Unknown destination handset',
  30006: 'Landline or unreachable carrier',
  30008: 'Unknown error',
};

async function checkSubscription(req, callback) {
  let status = 'pending';
  let errormessage = '';
  const queryObject = url.parse(req.url, true).query;
  logger.info(`Checking subscription status for ${JSON.stringify(queryObject)}`);
  const { index } = queryObject;
  let pgClient;

  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    logger.error(`Error getting database connection in check-subscription.js: ${err}`);
    status = 'failed';
    errormessage = 'Unknown error attempting to connect to database';
    callback({ code: 200, status, errormessage });
  }
  try {
    const res = await pgClient.query(`SELECT * FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = $1`, [index]);
    const subscribers = res.rows;
    if (subscribers.length <= 0) {
      status = 'failed';
      errormessage = 'Unable to find subscriber index';
    } else {
      status = subscribers[0].status;
      if (status === 'failed') {
        errormessage = 'Unknown error';
        if (subscribers[0].errorcode in twilioErrorCodes) {
          errormessage = twilioErrorCodes[subscribers[0].errorcode];
        }
      }
    }
  } catch (err) {
    logger.error(`Error in check-subscription.js: ${err}`);
  } finally {
    await pgClient.end();
  }

  callback({ code: 200, status, errormessage });
}
module.exports = {
  checkSubscription,
};
