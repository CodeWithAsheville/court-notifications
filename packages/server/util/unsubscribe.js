/* eslint-disable no-await-in-loop */
const { logger } = require('./logger');
const { getClient } = require('./db');

async function unsubscribe(phone, dbClientIn, reason = "unspecified") {
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
    console.log('Get subscribers with this phone');
    let res = await pgClient.query(
      `SELECT id FROM ${schema}.subscribers WHERE PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) = $2`,
      [process.env.DB_CRYPTO_SECRET, phone],
    );
    console.log('Row count is ', res.rowCount);
    if (res.rowCount > 0) { // Otherwise there's nothing to do
      const subscriberId = res.rows[0].id;
      console.log('Subscriber id is ', subscriberId);
      res = await pgClient.query(`SELECT defendant_id FROM ${schema}.subscriptions WHERE subscriber_id = $1`, [subscriberId]);
      console.log('Got a list of defendants subscribed to: ', res.rows);
      if (res.rowCount > 0) {
        const defendants = res.rows.map((obj) => obj.defendant_id);
        console.log('Here is the list of defendants again: ', defendants);
        for (let i = 0; i < defendants.length; i += 1) {
          res = await pgClient.query(
            `SELECT COUNT (*) FROM ${schema}.subscriptions WHERE defendant_id = $1`,
            [defendants[i]],
          );
          console.log(`Res.rowCount is ${res.rowCount}. If = 1, then we delete defendant and cases`);
          if (res.rowCount === 1) { // Delete if this is the only subscriber
            console.log('Delete the cases');
            await pgClient.query(`DELETE FROM ${schema}.cases WHERE defendant_id = $1`, [defendants[i]]);
            console.log('Delete the defendant');
            await pgClient.query(`DELETE FROM ${schema}.defendants WHERE id = $1`, [defendants[i]]);
            console.log('Done deleting defendant stuff');
          }
        }
      }
      console.log('Now delete the subscriptions');
      await pgClient.query(`DELETE FROM ${schema}.subscriptions WHERE subscriber_id = $1`, [subscriberId]);
      console.log('Now delete the subscriber');
      await pgClient.query(`DELETE FROM ${schema}.subscribers WHERE id = $1`, [subscriberId]);
      console.log('Now all done.');
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
