const MessagingResponse = require('twilio').twiml.MessagingResponse;

function respondToUser(res, message) {
  const twiml = new MessagingResponse();
  twiml.message(message);
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}

module.exports = {
  respondToUser
}
