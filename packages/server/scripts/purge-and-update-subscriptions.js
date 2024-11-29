/* eslint-disable no-await-in-loop */
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const path = require('path');
const Mustache = require('mustache');
require('dotenv').config({ path: '../.env' });

const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const { logger } = require('../util/logger');

const { getClient } = require('../util/db');
const { unsubscribe } = require('../util/unsubscribe');
const { getConfigurationIntValue } = require('../util/configurationValues');
const { twilioSendMessage } = require('../util/twilio-send-message');
const { formatName } = require('../util/formatName');

function getPreviousDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  const dString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
  return dString;
}

async function purgeSubscriptions(pgClient) {
  const daysBeforePurge = await getConfigurationIntValue(pgClient, 'days_before_purge', 30);
  const purgeDate = getPreviousDate(daysBeforePurge);
  const schema = process.env.DB_SCHEMA;

  // Note that we're not using the 'unsubscribe' routine here since that's focused on a
  // particular phone, not a defendant. While we could redo to specify a defendant (or default
  // to all), we also have a need to notify people here that we don't in any of the other
  // unsubscribe scenarios. Seems cleaner to just build this one to purpose.

  try {
    // Get a list of defendants who have had no cases for long enough
    let sql = `SELECT * FROM ${schema}.defendants d WHERE d.last_valid_cases_date < $1`;
    let res = await pgClient.query(sql, [purgeDate]);
    if (res.rowCount > 0) {
      const defendants = res.rows;
      for (let i = 0; i < defendants.length; i += 1) {
        const d = defendants[i];
        const defendantId = d.id;
        await pgClient.query('BEGIN');
        try {
          // Get the list of subscriber IDs to handle later
          sql = `SELECT ss.subscriber_id, ss.created_at as created_at, PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) AS phone
                  FROM ${schema}.subscriptions ss
                  LEFT JOIN ${schema}.subscribers s on s.id = ss.subscriber_id
                  WHERE ss.defendant_id = ${defendantId}`;
          res = await pgClient.query(sql, [process.env.DB_CRYPTO_SECRET]);
          const subscribers = res.rows;

          // Now go ahead and just delete the subscriptions
          sql = `
              DELETE FROM ${schema}.subscriptions WHERE defendant_id = ${defendantId}
          `;
          res = await pgClient.query(sql);

          // We can also delete the defendant and their cases
          res = await pgClient.query(`DELETE FROM ${schema}.cases WHERE defendant_id = ${defendantId}`);
          res = await pgClient.query(`DELETE FROM ${schema}.defendants WHERE id = ${defendantId}`);

          // Attempt to notify them
          if (subscribers && subscribers.length > 0) {
            for (let j = 0; j < subscribers.length; j += 1) {
              const s = subscribers[j];
              try {
                await i18next.changeLanguage(s.language);
                const message = Mustache.render(
                  i18next.t('unsubscribe.purge'),
                  { name: formatName(d.first_name, d.middle_name, d.last_name, d.suffix) },
                );
                await twilioSendMessage(twilioClient, s.phone, message);
              } catch (err) {
                logger.error(`Error sending final unsubscribe notification for phone ending in ${s.phone.substring(s.phone.length - 4)}: ${err}`);
              }
            }
          }

          // Now let's delete any subscribers, but only if they have no other subscriptions
          for (let j = 0; j < subscribers.length; j += 1) {
            const subscriberId = subscribers[j].subscriber_id;
            const phone4 = subscribers[j].phone.substring(subscribers[j].phone.length - 4);

            // Log it
            sql = `
              INSERT INTO ${schema}.log_unsubscribes
               (phone4, long_id, reason, original_subscribe_date, last_valid_cases_date)
               VALUES ($1, $2, 'No more cases', $3, $4)
            `;
            res = await pgClient.query(
              sql,
              [phone4, d.long_id, subscribers[j].created_at, d.last_valid_cases_date],
            );

            // Do it
            sql = `SELECT * FROM ${schema}.subscriptions WHERE subscriber_id = ${subscriberId}`;
            res = await pgClient.query(sql);
            if (res.rowCount === 0) {
              res = await pgClient.query(`DELETE FROM ${schema}.subscribers WHERE id = ${subscriberId}`);
            } else {
              logger.info(`Not deleting subscriber ${subscriberId} because they still have ${res.rowCount} other subscriptions`);
            }
          }
          await pgClient.query('COMMIT');
        } catch (err) {
          await pgClient.query('ROLLBACK');
          logger.error(`Error purging defendant ${defendantId} - transaction rolled back: `, err);
        }
      }
    }
  } catch (err) {
    logger.error('Error getting the list of defendants to be purged: ', err);
    throw err;
  }
}

async function unsubscribeFailed(pgClient) {
  // Delete all the subscribers with status failed. Note there's an edge case where we don't
  // catch the failure notification on a subscriber and the status stays pending. No need for
  // special logic. Another attempt will eventually be made which will properly set the status.
  const schema = process.env.DB_SCHEMA;
  const res = await pgClient.query(`
    SELECT id, PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) AS phone
    FROM ${schema}.subscribers WHERE status = 'failed'
    `, [process.env.DB_CRYPTO_SECRET]);

  for (let i = 0; i < res.rows.length; i += 1) {
    await unsubscribe(res.rows[i].phone, 'Status is failed', pgClient);
  }
}

async function updateSubscriptions(pgClient) {
  const schema = process.env.DB_SCHEMA;
  const daysBeforeUpdate = await getConfigurationIntValue(pgClient, 'days_before_update', 7);

  if (daysBeforeUpdate < 0) return;

  // Now we need to prepare to update information on remaining subscribers
  const updateDate = getPreviousDate(daysBeforeUpdate);
  logger.info(`Update defendants last updated before ${updateDate}`);
  const res = await pgClient.query(
    `SELECT id FROM ${schema}.defendants WHERE updated_at < $1 AND flag <> 1`,
    [updateDate],
  );

  if (res.rowCount > 0) {
    const defendantsToUpdate = res.rows.map(({ id }) => `(${id})`);
    logger.info(`Defendant count to be updated: ${defendantsToUpdate.length}`);
    await pgClient.query('BEGIN');
    try {
      await pgClient.query(`DELETE from ${schema}.records_to_update`); // Delete all
      await pgClient.query(
        `INSERT INTO ${schema}.records_to_update (defendant_id) VALUES ${defendantsToUpdate.join(',')}`,
      );
      await pgClient.query('COMMIT');
    } catch (err) {
      await pgClient.query('ROLLBACK');
      logger.error('Error inserting defendants for update - transaction rolled back: ', err);
    }
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
    logger.error('Error getting database client in purge-and-update-subscriptions', err);
    throw err;
  }
  try {
    logger.info('Purging expired subscriptions');
    await purgeSubscriptions(pgClient);
    logger.info('Unsubscribe all failed subscribers');
    await unsubscribeFailed(pgClient);
    logger.info('Identifying subscriptions ready for update');
    await updateSubscriptions(pgClient);
    logger.info('Done with purge-and-update-subscriptions');
  } catch (err) {
    logger.error('Error in purge-and-update-subscriptions.js: ', err);
  } finally {
    await pgClient.end();
  }
  process.exit();
})();
