const { logger } = require('./util/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

async function unsubscribeWithConfirmation(req, callback) {
  let message = 'If this phone is subscribed, a text will be sent for the subscriber to confirm that they wish to unsubscribe.';
  let returnCode = 200;

  if (!('phone_number') in req.body) {
    message = 'No phone number provided.';
    returnCode = 400;
  }
  else {
    const phone = req.body.phone_number;
    let subscriber = null;
    try {
      // Confirm that this number is a subscriber. If not, do nothing.
      const subscribers = await knex('subscribers')
      .where(
        knex.raw("PGP_SYM_DECRYPT(encrypted_phone::bytea, ?) = ?", [process.env.DB_CRYPTO_SECRET, phone])
      );
      if (subscribers && subscribers.length > 0) {
        subscriber = subscribers[0];
        await knex('subscribers')
        .where(
          knex.raw("PGP_SYM_DECRYPT(encrypted_phone::bytea, ?) = ?", [process.env.DB_CRYPTO_SECRET, phone])
        )
        .update({ status: 'unsubscribe'}); // Set status for later confirmation check
      }

      // Send a request for confirmation
      if (subscriber) {
        const client = require('twilio')(accountSid, authToken);
        const msg = 'A request was made to unsubscribe this number from buncombenc.courtdates.org notifications. To confirm, reply YES.'
        await client.messages
          .create({
            body: msg,
            from: fromTwilioPhone,
            to: phone
          })
          .then(async function(message) {
            logger.debug('Unsubscribe confirmation sent to subscriber ' + subscriber.id);
          });
      }
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