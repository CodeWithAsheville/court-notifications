require('dotenv').config({ path: '../../.env' })
const { logger } = require('../util/logger');
const { twilioSendMessage } = require('../util/twilio-send-message');
const i18next = require('i18next');
var FsBackend = require('i18next-fs-backend');

const { knex } = require('../util/db');
const { unsubscribe } = require('../util/unsubscribe');

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
  let count = await knex('cases').delete().where('court_date', '<', purgeDate);
  if (count > 0) logger.debug(count + ' cases purged');
  count = await knex('defendants').delete().whereNotExists(function() {
    this.select('*').from('cases').whereRaw('cases.defendant_id = defendants.id');
  });

  if (count > 0) logger.debug(count + ' defendants purged');
  count = await knex('subscriptions').delete().whereNotExists(function() {
    this.select('*').from('defendants').whereRaw('defendants.id = subscriptions.defendant_id');
  });
  if (count > 0) logger.debug(count + ' subscriptions purged');

  subscribers = await knex('subscribers')
  .select('subscribers.id', 'subscribers.language',
  knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET]))
  .whereNotExists(function() {
    this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
  });

  // Attempt to notify them
  if (subscribers && subscribers.length > 0) {
    logger.debug(subscribers.length + ' subscribers purged');
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    for (let i = 0; i< subscribers.length; ++i) {
      try {
        s = subscribers[i];
        await i18next.changeLanguage(s.language);
        const message = i18next.t('unsubscribe.purge');
        await twilioSendMessage(client, s.phone, message);
      } 
      catch (err) {
        logger.error('Error sending final unsubscribe notification: ' + err);
      }
    }
  }

  // Now actually delete them.
  await knex('subscribers').delete().whereNotExists(function() {
    this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
  });

  // Delete all the subscribers with status failed
  let failedSubscribers = await knex('subscribers')
    .select('subscribers.id',
    knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET]))
    .where('status', '=', 'failed');

  while (failedSubscribers.length > 0) {
    const s = failedSubscribers.pop();
    await unsubscribe(s.phone);
  }

  // There is an edge case where we don't catch the notification
  // of failure on a subscriber and the status could stay pending.
  // I don't think we need special logic for this - there will be an 
  // attempt to notify at some point and whether it succeeds or fails,
  // the status will be properly set and the record set to either 'failed'
  // or 'confirmed'.

  // Now we need to prepare to update information on remaining subscribers
  const updateDate = getPreviousDate(daysBeforeUpdate);
  const defendantsToUpdate = await knex('defendants').select('id as defendant_id')
    .where('updated_at', '<', updateDate);
  await knex('records_to_update').delete(); // Delete all 
  if (defendantsToUpdate && defendantsToUpdate.length > 0) {
    await knex('records_to_update').insert(defendantsToUpdate);
  }

}

async function initTranslations() {
  await i18next
  .use(FsBackend)
  .init({
    saveMissing: false,
    debug: false,
    fallbackLng: 'en',
    backend: {
      loadPath: __dirname + '/../locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/../locales/{{lng}}/{{ns}}.missing.json'
    }
  });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

// Purge all court cases in the past and everything that 
// depends only on them. Then set up a list of defendants 
// due to be updated. Actual updates happen in a separate
// script
(async() => {
  await initTranslations();
  logger.debug('Call purge-and-update-subscriptions');
  await purgeAndUpdateSubscriptions();
  logger.debug('Done with purge');
  process.exit();
})();
