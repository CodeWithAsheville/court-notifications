const { twilioRespondToUser } = require('./twilio-respond-to-user');
const unsubscribeImport = require('./unsubscribe');
const { logger } = require('./logger');

const doUnsubscribe = unsubscribeImport.unsubscribe;

async function unsubscribe(req, res) {
  // Use req.body.From to get the number,
  // look it up the database
  let message = null;

  try {
    let phone = req.body.From;
    if (phone.startsWith('+1')) {
      phone = phone.substring(2);
    }
    doUnsubscribe(phone, 'Subscriber request');
  } catch (e) {
    logger.error(`twilio-actions.unsubscribe: ${e}`);
    message = 'An error occurred. Unsubscribe unsuccessful';
  }

  if (message !== null) twilioRespondToUser(res, message);
}

async function resubscribe(req, res) {
  // Use req.body.From to get the number,
  // look it up the database
  let message = 'Your phone number can now receive court reminders. You will need to sign up again at https://buncombenc.courtdates.org';

  try {
    let phone = req.body.From;
    if (phone.startsWith('+1')) {
      phone = phone.substring(2);
    }
  } catch (e) {
    logger.error(`twilio-actions.resubscribe: ${e}`);
    message = 'An error occurred. Resubscribe unsuccessful.';
  }

  twilioRespondToUser(res, message);
}

async function unknown(req, res) {
  const message = 'Unknown request. Text STOP to unsubscribe.';
  twilioRespondToUser(res, message);
}

module.exports = {
  unsubscribe,
  resubscribe,
  unknown,
};
