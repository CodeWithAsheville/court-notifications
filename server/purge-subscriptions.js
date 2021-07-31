const knexConfig = require('../knexfile');
var env         = 'development';
var knex        = require('knex')(knexConfig[env]);

async function purgeSubscriptions(body, callback, onError) {  
  let returnMessage = 'Successfully subscribed';

  try {
    // code here
  }
  catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
  }

  callback({message: returnMessage});
}
module.exports = {
  purgeSubscriptions
}