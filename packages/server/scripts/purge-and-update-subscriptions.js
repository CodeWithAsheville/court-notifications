/* eslint-disable no-await-in-loop */
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const path = require('path');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

require('dotenv').config({ path: '../../.env' });
const { logger } = require('../util/logger');
const { twilioSendMessage } = require('../util/twilio-send-message');

const { knex } = require('../util/db');
const { unsubscribe } = require('../util/unsubscribe');

function getPreviousDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const dString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
  return dString;
}

async function getConfigurationIntValue(name, defaultValue = 0) {
  let value = defaultValue;
  const result = await knex('cn_configuration').select('value').where('name', '=', name);
  if (result.length > 0) value = parseInt(result[0].value, 10);
  return value;
}

async function purgeSubscriptions() {
  const daysBeforePurge = await getConfigurationIntValue('days_before_purge', 30);
  const purgeDate = getPreviousDate(daysBeforePurge);

  let count = await knex('defendants').delete()
    .where('last_valid_cases_date', '<', purgeDate);

  if (count > 0) {
    logger.debug(`Purging ${count} defendants`);
    // eslint-disable-next-line func-names
    count = await knex('subscriptions').delete().whereNotExists(function () {
      this.select('*').from('defendants').whereRaw('defendants.id = subscriptions.defendant_id');
    });
    if (count > 0) logger.debug(`${count} subscriptions purged`);

    const subscribers = await knex('subscribers')
      .select(
        'subscribers.id',
        'subscribers.language',
        // eslint-disable-next-line comma-dangle
        knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET])
      )
      // eslint-disable-next-line func-names
      .whereNotExists(function () {
        this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
      });

    // Attempt to notify them
    if (subscribers && subscribers.length > 0) {
      logger.debug(`${subscribers.length} subscribers purged`);
      for (let i = 0; i < subscribers.length; i += 1) {
        try {
          const s = subscribers[i];
          await i18next.changeLanguage(s.language);
          const message = i18next.t('unsubscribe.purge');
          await twilioSendMessage(client, s.phone, message);
        } catch (err) {
          logger.error(`Error sending final unsubscribe notification: ${err}`);
        }
      }
    }
    // Now actually delete them.
    // eslint-disable-next-line func-names
    await knex('subscribers').delete().whereNotExists(function () {
      this.select('*').from('subscriptions').whereRaw('subscriptions.subscriber_id = subscribers.id');
    });
  } else {
    logger.debug('No defendants purged');
  }
}

async function updateSubscriptions() {
  const daysBeforeUpdate = await getConfigurationIntValue('days_before_update', 7);

  if (daysBeforeUpdate < 0) return;

  // Delete all the subscribers with status failed
  const failedSubscribers = await knex('subscribers')
    .select(
      'subscribers.id',
      // eslint-disable-next-line comma-dangle
      knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET])
    )
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
    .where('updated_at', '<', updateDate)
    .andWhere('flag', '<>', 1);

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
        loadPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.missing.json'),
      },
    });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

// Purge all court cases in the past and everything that
// depends only on them. Then set up a list of defendants
// due to be updated. Actual updates happen in a separate
// script
(async () => {
  await initTranslations();
  logger.debug('Call purgeSubscriptions');
  await purgeSubscriptions();
  logger.debug('Done with purge');
  logger.debug('Call updateSubscriptions');
  await updateSubscriptions();
  logger.debug('Done with update setup');
  process.exit();
})();
