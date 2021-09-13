const knexConfig = require('../../../knexfile');
const knex = require('knex')(knexConfig);
const respondToUser = require('./respond-to-user')

async function unsubscribe(req, res) {
  // Use req.body.From to get the number, 
  // look it up the database
  let message = 'Successfully unsubscribed!'

  try {
    const subscribers = await knex('subscribers').where('phone', req.body.From)
    subscribers.forEach(async subscriber => {
      await knex('subscriptions').delete().where('subscriber_id', subscriber.id)
    })
  } catch(e) {
    console.error(e)
    message = 'An error occurred. Subscribe unsuccessful'
  }

  respondToUser(res, message)
}

module.exports = {
  unsubscribe
}