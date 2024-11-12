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
  console.log()
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
    let res = await pgClient.query(sql, [purgeDate]);
    const subscribers = new Set();
    const defendants = new Set();

    if (res.rowCount > 0) {
      for (let i = 0; i < res.rowCount; i += 1) {
        // eslint-disable-next-line camelcase
        const { subscriber_id, defendant_id } = res.rows[i];
        subscribers.add(subscriber_id);
        defendants.add(defendant_id);
      }

      let arr = [...defendants];
      // We can go ahead and just delete the subscriptions
      sql = `
          DELETE FROM ${process.env.DB_SCHEMA}.subscriptions WHERE defendant_id IN (${arr.join(',')})
      `;
      res = await pgClient.query(sql);

      // We can also just delete all the defendants and their cases
      for (let i = 0; i < arr.length; i += 1) {
        const defendantId = arr[i];
        res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.cases WHERE defendant_id = ${defendantId}`);
        res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.defendants WHERE id = ${defendantId}`);
      }

      // Now let's look at subscribers, but deleting only if they have no other subscriptions
      arr = [...subscribers];
      for (let i = 0; i < arr.length; i += 1) {
        sql = `SELECT * FROM ${process.env.DB_SCHEMA}.subscriptions WHERE subscriber_id = ${arr[i]}`;
        res = await pgClient.query(sql);
        if (res.rowCount === 0) {
          res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = ${arr[i]}`);
        } else {
          console.log(`Not deleting subscriber ${arr[i]} because they still have ${res.rowCount} subscriptions`);
        }
      }
    }
  } catch (err) {
    logger.error('Error getting the list of defendants to be purged: ', err);
    throw err;
  }
}

async function updateSubscriptions(pgClient) {
  const schema = process.env.DB_SCHEMA;
  const daysBeforeUpdate = await getConfigurationIntValue(pgClient, 'days_before_update', 7);

  if (daysBeforeUpdate < 0) return;

  // Delete all the subscribers with status failed. Note there's an edge case where we don't
  // catch the failure notification on a subscriber and the status stays pending. No need for
  // special logic. Another attempt will eventually be made which will properly set the status.

  let res = await pgClient.query(`
    SELECT id, PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) AS phone
    FROM ${schema}.subscribers WHERE status = 'failed'
    `, [process.env.DB_CRYPTO_SECRET]);

  for (let i = 0; i < res.rows.length; i += 1) {
    console.log('Unsubscribe id ', res.rows[i].id);
    await unsubscribe(res.rows[i].phone);
  }

  // Now we need to prepare to update information on remaining subscribers
  const updateDate = getPreviousDate(daysBeforeUpdate);
  console.log('Update date is ', updateDate);
  res = await pgClient.query(
    `SELECT id FROM ${schema}.defendants WHERE updated_at <= $1 AND flag <> 1`,
    [updateDate],
  );
  console.log('Row count is ', res.rowCount);
  if (res.rowCount > 0) {
    const defendantsToUpdate = res.rows.map(({ id }) => id);

    await pgClient.query(`DELETE from ${schema}.records_to_update`); // Delete all
    await pgClient.query(
      `INSERT INTO ${schema}.records_to_update (defendant_id) VALUES (${defendantsToUpdate.join(',')})`,
    );
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
  try {
    logger.debug('Call purgeSubscriptions');
    await purgeSubscriptions(pgClient);
    logger.debug('Done with purge');
    logger.debug('Call updateSubscriptions');
    await updateSubscriptions(pgClient);
    logger.debug('Done with update setup');
  } catch (err) {
    console.log('Error in purge-and-update-subscriptions.js: ', err)
  } finally {
    await pgClient.end();
  }
  process.exit();
})();
