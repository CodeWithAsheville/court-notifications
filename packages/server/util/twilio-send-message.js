const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;
const { logger } = require('./logger');

async function twilioSendMessage(client, phone, inMessage) {
  const msgObject = {
    body: inMessage,
    from: fromTwilioPhone,
    to: phone,
  };
  return client.messages
    .create(msgObject)
    .then((message) => {
      logger.info(`Message sent: ${message.body}`);
    });
}

module.exports = {
  twilioSendMessage,
};
