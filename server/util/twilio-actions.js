const { knex } = require('./db');
const respondToUser = require('./twilio-respond-to-user')
const doUnsubscribe = require('../util/unsubscribe').unsubscribe;
const { logger } = require('./logger');

async function unsubscribe(req, res) {
  // Use req.body.From to get the number, 
  // look it up the database
  let message = 'Successfully unsubscribed!'

 try {
    let phone = req.body.From;
    if (phone.startsWith('+1')) {
      phone = phone.substring(2);
    }
    doUnsubscribe(phone);
  } catch(e) {
    logger.error(e)
    message = 'An error occurred. Unsubscribe unsuccessful'
  }

  respondToUser(res, message)
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
  } catch(e) {
    logger.error(e)
    message = 'An error occurred. Resubscribe unsuccessful.'
  }

  respondToUser(res, message)
}

module.exports = {
  unsubscribe,
  resubscribe
}