const knexConfig = require('../../../knexfile');
const knex = require('knex')(knexConfig);
const respondToUser = require('./respond-to-user')
const doUnsubscribe = require('../unsubscribe').unsubscribe;

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
    console.error(e)
    message = 'An error occurred. Unsubscribe unsuccessful'
  }

  respondToUser(res, message)
}

async function resubscribe(req, res) {
  // Use req.body.From to get the number, 
  // look it up the database
  let message = 'Your phone number can now receive court reminders. You will need to sign up again at https://buncombe.courtdates.org';

 try {
    let phone = req.body.From;
    if (phone.startsWith('+1')) {
      phone = phone.substring(2);
    }
  } catch(e) {
    console.error(e)
    message = 'An error occurred. Resubscribe unsuccessful.'
  }

  respondToUser(res, message)
}

module.exports = {
  unsubscribe,
  resubscribe
}