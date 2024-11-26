/* eslint-disable no-await-in-loop */
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const { logger } = require('../util/logger');

const { getClient } = require('../util/db');
const { unsubscribe } = require('../util/unsubscribe');
const { getConfigurationIntValue } = require('../util/configurationValues');
const { twilioSendMessage } = require('../util/twilio-send-message');

function getPreviousDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  const dString = `${d.getFullYear()}-${(d.getMonth() + 1)}-${d.getDate()}`;
  return dString;
}

async function purgeSubscriptions(pgClient) {
  const daysBeforePurge = await getConfigurationIntValue(pgClient, 'days_before_purge', 30);
  const purgeDate = getPreviousDate(daysBeforePurge);

  // Note that we're not using the 'unsubscribe' routine here since that's focused on a
  // particular phone, not a defendant. While we could redo to specify a defendant (or default
  // to all), we also have a need to notify people here that we don't in any of the other
  // unsubscribe scenarios. Seems cleaner to just build this one to purpose.

  try {
    // Get a list of defendants who have had no cases for long enough
    let sql = `SELECT id FROM ${process.env.DB_SCHEMA}.defendants d WHERE d.last_valid_cases_date < $1`;
    let res = await pgClient.query(sql, [purgeDate]);
    if (res.rowCount > 0) {
      const defendants = res.rows;
      for (let i = 0; i < defendants.length; i += 1) {
        const defendantId = defendants[i].id;
        await pgClient.query('BEGIN');
        try {
          // Get the list of subscriber IDs to handle later
          sql = `SELECT ss.subscriber_id, PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) AS phone
                  FROM ${process.env.DB_SCHEMA}.subscriptions ss
                  LEFT JOIN ${process.env.DB_SCHEMA}.subscribers s on s.id = ss.subscriber_id
                  WHERE ss.defendant_id = ${defendantId}`;
          res = await pgClient.query(sql);
          const subscribers = res.rows;

          // Now go ahead and just delete the subscriptions
          sql = `
              DELETE FROM ${process.env.DB_SCHEMA}.subscriptions WHERE defendant_id = ${defendantId}
          `;
          res = await pgClient.query(sql);

          // We can also delete the defendant and their cases
          res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.cases WHERE defendant_id = ${defendantId}`);
          res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.defendants WHERE id = ${defendantId}`);

          // Attempt to notify them
          if (subscribers && subscribers.length > 0) {
            logger.debug(`${subscribers.length} subscribers purged`);
            for (let j = 0; j < subscribers.length; j += 1) {
              try {
                const s = subscribers[j];
                console.log(s);
                await i18next.changeLanguage(s.language);
                const message = i18next.t('unsubscribe.purge');
                await twilioSendMessage(twilioClient, s.phone, message);
              } catch (err) {
                logger.error(`Error sending final unsubscribe notification: ${err}`);
              }
            }
          }

          // Now let's delete any subscribers, but only if they have no other subscriptions
          for (let j = 0; j < subscribers.length; j += 1) {
            const subscriberId = subscribers[j].subscriber_id;
            sql = `SELECT * FROM ${process.env.DB_SCHEMA}.subscriptions WHERE subscriber_id = ${subscriberId}`;
            res = await pgClient.query(sql);
            if (res.rowCount === 0) {
              res = await pgClient.query(`DELETE FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = ${subscriberId}`);
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
    await unsubscribe(res.rows[i].phone, pgClient, 'Status is failed');
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
    // eslint-disable-next-line no-console
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
