// NOTE: You need to do this with the updated path
// for any file you want to run in isolation. 
// Yet another reason to add an actual test runner...
require('dotenv').config({ path: '../../.env'})

const knexConfig = require('../../knexfile');
const knex = require('knex')(knexConfig);

const { twilioIncomingWebhook } = require('../twilio-incoming-webhook');

/**
 * We should get an actual test library...
 * But this works for now
 */
const successess = []
const errors = []

function test(description, cb) {
  let failed = false

  try {
    cb()
  } catch(e) {
    failed = true
    errors.push({ description, error: e })
  }

  if (!failed) successess.push({ description }) 
}
/**
 * End fake test stuff
 */


const res = {
  writeHead: () => {},
  end: () => {}
}

const req = {
  body: {
    Body: 'unsubscribe',
    From: '+12408107724'
  }
}

test('Should be able to parse webhook', () => twilioIncomingWebhook(req, res))
test('What will happen?', () => (true === true))

successess.forEach(success => console.log('\x1b[32m%s\x1b[0m', success.description + '\n'))
errors.forEach(error => console.log('\x1b[31m%s\x1b[0m', error.description + '\n\n', error.error, '\n\n'))

process.exit()
