require('dotenv').config({ path: '../../.env' })
const knexConfig = require('../../knexfile');
const { logger } = require('./logger');

var knex        = require('knex')(knexConfig);

function getPreviousDate(days) {
  const d = new Date();
  d.setDate(d.getDate()-days);
  const dString = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  return dString;
}

async function getConfigurationIntValue(name, defaultValue = 0) {
  let value = defaultValue;
  let result = await knex('cn_configuration').select('value').where('name', '=', name);
  if (result.length > 0) value = parseInt(result[0].value)
  return value;
}

async function purgeAndUpdateSubscriptions() {
  // Do a rolling delete of expired cases, then anything that depends only on them.
  const daysBeforePurge = await getConfigurationIntValue('days_before_purge', 1);
  const daysBeforeUpdate = await getConfigurationIntValue('days_before_update', 7);
  const purgeDate = getPreviousDate(daysBeforePurge);

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
  const updateDate = getPreviousDate(daysBeforeUpdate);

  const defendantsToUpdate = await knex('defendants').select('id as defendant_id')
    .where('updated_at', '<', updateDate);

  await knex('records_to_update').delete(); // Delete all 
  await knex('records_to_update').insert(defendantsToUpdate);
}

// Purge all court cases in the past and everything that 
// depends only on them. Then set up a list of defendants 
// due to be updated. Actual updates happen in a separate
// script
(async() => {
  logger.debug('Call purge-and-update-subscriptions');
  await purgeAndUpdateSubscriptions();
  logger.debug('Done with purge');
  process.exit();
})();
