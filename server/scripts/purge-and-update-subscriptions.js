require('dotenv').config({ path: '../../.env' })
const { syslog } = require('winston/lib/winston/config');
const knexConfig = require('../../knexfile');
const { logger } = require('./logger');
const { twilioSendMessage } = require('./twilio/twilio_send_message');
const i18next = require('i18next');
var FsBackend = require('i18next-fs-backend');

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

  subscribers = await knex('subscribers')
  .select('subscribers.id', 'subscribers.language',
  knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET]))
  .whereNotExists(function() {
    this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
  });
  // Attempt to notify them
  if (subscribers && subscribers.length > 0) {
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKE);
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
