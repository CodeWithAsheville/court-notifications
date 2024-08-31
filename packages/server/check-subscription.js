const url = require('url');
const { getDBClient } = require('./util/db');
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
  let client;
  try {
    client = getDBClient();
    await client.connect();
  } catch (e) {
    logger.error(`util/subscribe.addSubscriber db connect: ${e}`);
    throw Error('Error connecting to database');
  }
  try {
    const queryObject = url.parse(req.url, true).query;
    logger.debug(`Checking subscription status for index ${JSON.stringify(queryObject)}`);
    const { index } = queryObject;
    const res = await client.query(`
      SELECT * FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = $1
      `, [index]);
    const subscribers = res.rows;
    if (subscribers.length <= 0) {
      status = 'failed';
      errormessage = 'Unknown error';
    } else {
      status = subscribers[0].status;
      if (status === 'failed') {
        errormessage = 'Unknown error';
        if (subscribers[0].errorcode in twilioErrorCodes) {
          errormessage = twilioErrorCodes[subscribers[0].errorcode];
        }
      }
    }
  } catch (e) {
    logger.error(`Error in check-subscription.js: ${e}`);
  }
  callback({ code: 200, status, errormessage });
}
module.exports = {
  checkSubscription,
};
