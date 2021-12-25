const { logger } = require('./util/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;


async function unsubscribeWithConfirmation(req, callback) {
  let message = 'Unsubscribe request processing - check your phone.';
  let returnCode = 200;

  if (!('phone_number') in req.body) {
    message = 'No phone number provided.';
    returnCode = 400;
  }
  else {
    try {
  //    const client = require('twilio')(accountSid, authToken);
      console.log(JSON.stringify(req.body));
    }
    catch (err) {
      message = 'Error: ' + err;
      returnCode = 500;
      logger.error('Error processing unsubscribe request: ' + err);
    }
  }
  callback({ message, code: returnCode });
}

module.exports = {
  unsubscribeWithConfirmation
}