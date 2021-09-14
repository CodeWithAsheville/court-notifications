// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const from_phone_number = process.env.TWILIO_PHONE_NUMBER
const to_phone_number = process.env.TEST_PHONE_NUMBER
const client = require('twilio')(accountSid, authToken);

client.messages
  .create({
     body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
     from: from_phone_number,
     to: to_phone_number
   })
  .then(console.log)
  .catch(console.error)

