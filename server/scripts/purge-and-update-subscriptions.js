const knexConfig = require('../../knexfile');
var env         = 'development';
var knex        = require('knex')(knexConfig[env]);

async function purgeAndUpdateSubscriptions(purgeDate, updateDays) {
  // Do a rolling delete of expired cases, then anything that depends only on them.
  await knex('cases').delete().where('court_date', '<', purgeDate);
  await knex('defendants').delete().whereNotExists(function() {
    this.select('*').from('cases').whereRaw('cases.defendant_id = defendants.id');
  });
  await knex('subscriptions').delete().whereNotExists(function() {
    this.select('*').from('defendants').whereRaw('defendants.id = subscriptions.defendant_id');
  });
  await knex('subscribers').delete().whereNotExists(function() {
    this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
  });

  // Now we need to prepare to update information on remaining subscribers
  const d = new Date();
  d.setDate(d.getDate()-updateDays);
  const dString = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

  const defendantsToUpdate = await knex('defendants').select('id as defendant_id')
    .where('updated_at', '<', dString);
  await knex('records_to_update').delete(); // Delete all 
  await knex('records_to_update').insert(defendantsToUpdate);

  // Now set up a job to update over time
  const count = defendantsToUpdate.length;
  const updatesPerHour = Math.ceil((count)/23);
  console.log('Updates per hour = ' + updatesPerHour);
}

// Purge all court cases in the past and everything that 
// depends only on them. Then set up a list of defendants 
// due to be updated. Actual updates happen in a separate
// script
(async() => {
  console.log('Call purge-and-update-subscriptions');
  await purgeAndUpdateSubscriptions('2021-08-09', -1);
  console.log('Done with purge');
  process.exit();
})();