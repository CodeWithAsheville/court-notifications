/* eslint-disable no-await-in-loop */
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const { logger } = require('../util/logger');

const { knex, getClient } = require('../util/db');
const { unsubscribe } = require('../util/unsubscribe');

function getPreviousDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const dString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
  return dString;
}

async function getConfigurationIntValue(pgClient, name, defaultValue = 0) {
  let value = defaultValue;
  try {
    const res = await pgClient.query(`SELECT value from ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`, [name]);
    const results = res.rows;
    if (results.length > 0) value = parseInt(results[0].value, 10);
    console.log(`Got the configuration value ${name}: ${value}`);
  } catch (err) {
    logger.error(`Error getting configuration value ${name} client in purge-and-update-subscriptions`, err);
    throw err;
  }
  return value;
}

async function purgeSubscriptions(pgClient) {
  const daysBeforePurge = await getConfigurationIntValue(pgClient, 'days_before_purge', 30);
  const purgeDate = getPreviousDate(daysBeforePurge);
  // Need to add in logging ... in some detail I think. Think how we really want to do logging.
  try {
    // Get a list of defendants who have had no cases for long enough
    let sql = `
        SELECT s.defendant_id, s.subscriber_id FROM ${process.env.DB_SCHEMA}.subscriptions s
        LEFT JOIN ${process.env.DB_SCHEMA}.defendants d on s.defendant_id = d.id
        WHERE d.last_valid_cases_date < $1
      `;
    console.log('GET subs of defendants to purge');
    console.log(sql);
    let res = await pgClient.query(sql, [purgeDate]);
    const subscribers = new Set();
    const defendants = new Set();

    console.log(res.rows);
    for (let i = 0; i < res.rowCount; i += 1) {
      // eslint-disable-next-line camelcase
      const { subscriber_id, defendant_id } = res.rows[i];
      subscribers.add(subscriber_id);
      defendants.add(defendant_id);
    }

    // We can go ahead and just delete the subscriptions
    sql = `
        DELETE FROM ${process.env.DB_SCHEMA}.subscriptions WHERE defendant_id IN (${[...defendants].join(',')})
    `;
    console.log('Here is the deletion of the subscriptions');
    console.log(sql);
    res = await pgClient.query(sql);
    console.log(`Deleted subscriptions: ${res.rowCount} items`);

    // We can also just delete all the defendants and their cases
    let arr = [...defendants];
    for (let i = 0; i < arr.length; i += 1) {
      const defendantId = arr[i];
      res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.cases WHERE defendant_id = ${defendantId}`);
      console.log(`Deleted cases for defendant ${defendantId}: ${res.rowCount} items `);
      console.log(res.rows);
      res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.defendants WHERE id = ${defendantId}`);
      console.log(`Deleted defendant ${defendantId}: ${res.rowCount} items `, res.rows);
      console.log(res.rows);
    }

    // Now let's look at subscribers, but deleting only if they have no other subscriptions
    arr = [...subscribers];
    for (let i = 0; i < arr.length; i += 1) {
      sql = `SELECT * FROM ${process.env.DB_SCHEMA}.subscriptions WHERE subscriber_id = ${arr[i]}`;
      console.log('SQL for subscriber lookup ', arr[i]);
      console.log(sql);
      res = pgClient.query(sql);
      console.log(`Checking for subscriptions for subscriber ${arr[i]}: ${res.rowCount} items`);
      if (res.rowCount === 0) {
        res = pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = ${arr[i]}`);
        console.log(`Deleted subscriber ${arr[i]}: ${res.rowCount} items`);
      } else {
        console.log(`Not deleting subscriber ${arr[i]} because they still have ${res.rowCount} subscriptions`);
      }
    }
  } catch (err) {
    logger.error('Error getting the list of defendants to be purged: ', err);
    throw err;
  }
  /*
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
  */
}

async function updateSubscriptions(pgClient) {
  const daysBeforeUpdate = await getConfigurationIntValue(pgClient, 'days_before_update', 7);

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
  let pgClient;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    logger.error('Error getting database client in purge-and-update-subscriptions', err);
    throw err;
  }
  logger.debug('Call purgeSubscriptions');
  await purgeSubscriptions(pgClient);
  logger.debug('Done with purge');
  // logger.debug('Call updateSubscriptions');
  // await updateSubscriptions();
  // logger.debug('Done with update setup');
  process.exit();
})();
