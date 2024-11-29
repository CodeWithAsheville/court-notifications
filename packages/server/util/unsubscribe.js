/* eslint-disable no-await-in-loop */
const { logger } = require('./logger');
const { getClient } = require('./db');

async function unsubscribe(phone, reason, dbClientIn) {
  let pgClient = dbClientIn;
  const schema = process.env.DB_SCHEMA;
  if (dbClientIn === undefined) { // Get a client if not provided
    try {
      pgClient = getClient();
      await pgClient.connect();
    } catch (err) {
      logger.error('Error getting database client in unsubscribe', err);
      throw err;
    }
  }
  logger.info(`Unsubscribing phone ending in ${phone.substring(phone.length - 4)}, reason: ${reason}`);
  try {
    let res = await pgClient.query(
      `SELECT id FROM ${schema}.subscribers WHERE PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) = $2`,
      [process.env.DB_CRYPTO_SECRET, phone],
    );
    if (res.rowCount > 0) { // Otherwise there's nothing to do
      const { id } = res.rows[0];
      const phone4 = phone.substring(phone.length - 4);

      pgClient.query('BEGIN');
      try {
        res = await pgClient.query(
          `
            SELECT s.defendant_id, s.created_at as original_subscribe_date, d.long_id, d.last_valid_cases_date
             FROM ${schema}.subscriptions s LEFT JOIN ${schema}.defendants d on s.defendant_id = d.id
             WHERE s.subscriber_id = $1
          `,
          [id],
        );
        const defendants = res.rows;
        for (let i = 0; i < defendants.length; i += 1) {
          const d = defendants[i];
          res = await pgClient.query(
            `SELECT COUNT(*) FROM ${schema}.subscriptions WHERE defendant_id = $1`,
            [d.defendant_id],
          );

          if (res.rows[0].count === 1) { // Delete if this is the only subscriber
            await pgClient.query(`DELETE FROM ${schema}.cases WHERE defendant_id = $1`, [defendants[i]]);
            await pgClient.query(`DELETE FROM ${schema}.defendants WHERE id = $1`, [defendants[i]]);
          }
          // Log it
          res = await pgClient.query(
            `
              INSERT INTO ${schema}.log_unsubscribes
              (phone4, long_id, reason, original_subscribe_date, last_valid_cases_date)
              VALUES ($1, $2, $3, $4, $5)
            `,
            [phone4, d.long_id, reason, d.original_subscribe_date, d.last_valid_cases_date],
          );
        }
        await pgClient.query(`DELETE FROM ${schema}.subscriptions WHERE subscriber_id = $1`, [id]);
        await pgClient.query(`DELETE FROM ${schema}.subscribers WHERE id = $1`, [id]);
        pgClient.query('COMMIT');
      } catch (err) {
        logger.error(`Error unsubscribing phone ending in ${phone.substring(phone.length - 4)} - rolling back: ${err}`);
        pgClient.query('ROLLBACK');
        throw err;
      }
    } else {
      logger.info('Attempt to unsubscribe a number with no subscriptions');
    }
  } catch (err) {
    logger.error(`Error in util/unsubscribe: ${err}`);
  } finally {
    if (dbClientIn === undefined) await pgClient.end();
  }
}

module.exports = {
  unsubscribe,
};
