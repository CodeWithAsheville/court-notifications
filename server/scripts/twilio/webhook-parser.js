/**
 * How this works:
 * 
 * Parses the request body of any incoming webhooks, and
 * attempts to identify any verbs. If a verb is identified
 * in the text body, the corresponding action function 
 * executes any business logic.
 * 
 * To add new actions, create a new file inside of `/actions`
 * with the name of your action. Export the function, and 
 * add it to the default export object inside `/actions/index.js`.
 * Write your business logic inside your new action function.
 * 
 * Finally, add a new verb to the verbs enum. They key should
 * match your action name, and the value should contain the name
 * of the action and any synonyms you desire.
 * 
 * Here's an example of the request body
 * 
 * For reference, here's an example request body from Twilio
 * {
 *   ToCountry: 'US',
 *   ToState: 'CA',
 *   SmsMessageSid: '<__Sid__>',
 *   NumMedia: '0',
 *   ToCity: 'GARDEN GROVE',
 *   FromZip: '',
 *   SmsSid: '<__Sid__>',
 *   FromState: 'MD',
 *   SmsStatus: 'received',
 *   FromCity: '',
 *   Body: 'I',
 *   FromCountry: 'US',
 *   To: '+17145555555',
 *   MessagingServiceSid: '<__Sid__>',
 *   ToZip: '92707',
 *   NumSegments: '1',
 *   MessageSid: '<__Sid__>',
 *   AccountSid: '<__Sid__>',
 *   From: '+15555555555',
 *   ApiVersion: '2010-04-01'
 * }
 */
const twilio = require('twilio')
const actions = require('./actions')
const respondToUser = require('./respond-to-user')

const verbs = {
  unsubscribe: ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'],
  resubscribe: ['start', 'yes', 'unstop']
}

/**
 * Given a verb and a string of words, 
 * identify any words that match the verb.
 * 
 * @param {String} verb 
 * @param {String} words 
 * @returns {String[]}
 */
function matchWords(verb, words) {
  const regexMetachars = /[(){[*+?.\\^$|]/g;

  for (let i = 0; i < words.length; i++) {
      words[i] = words[i].replace(regexMetachars, "\\$&");
  }

  const regex = new RegExp("\\b(?:" + words.join("|") + ")\\b", "gi");

  return verb.toLowerCase().match(regex) || [];
}

/**
 * Given a verb and a string of words,
 * determine if the words contains a match
 * for the verb.
 * 
 * @param {String} verb 
 * @param {String} words 
 * @returns {Boolean}
 */
function hasMatches(verb, words) {
  return matchWords(verb, words).length > 0
}

/**
 * Finds the first matching verb in the message
 * body
 * 
 * @param {String} body 
 * @returns {String}
 */
function identifyVerbs(body) {
  return Object.keys(verbs).find(verb => hasMatches(body, verbs[verb]))
}

function parseWebhook(req, res) {
  // Make sure this is from Twilio
  const twilioSignature = req.headers['x-twilio-signature'];
  const params = req.body;
  const url = 'https://bc-court-reminders-dev.herokuapp.com/sms';
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    params
  );
  if (!isValid) {
    console.log('Invalid incoming request - not from Twilio');
  } 
  else {
    console.log('It is a valid request!');
  }

  const verb = identifyVerbs(req.body.Body)
  console.log('We are successfully here in the webhook');
  if (verb === undefined) {
    respondToUser(res, 'Unknown request. Text STOP to unsubscribe.')
  } else {
    console.log(actions, verb, actions[verb])
    return actions[verb](req, res)
  }
}

module.exports = {
  parseWebhook
}
