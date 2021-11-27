const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;
const { logger } = require('../logger');

async function twilioSendMessage(client, phone, message) {
  const msgObject = {
    body: message,
    from: fromTwilioPhone,
    to: phone
  };
  return await client.messages
  .create(msgObject)
  .then(message => logger.debug('Message sent: ', message));
}

module.exports = {
  twilioSendMessage
}

