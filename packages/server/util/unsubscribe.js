/* eslint-disable no-await-in-loop */
const { getDBClient } = require('./db');
const { logger } = require('./logger');

async function unsubscribe(phone) {
  let client;
  try {
    client = getDBClient();
    await client.connect();
  } catch (e) {
    logger.error(`util/subscribe.addSubscriber db connect: ${e}`);
    throw Error('Error connecting to database');
  }

  // Delete subscriber and any associated subscriptions
  try {
    let res = await client.query(`
      SELECT * FROM ${process.env.DB_SCHEMA}.subscribers 
        WHERE PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) = $2
      `, [process.env.DB_CRYPTO_SECRET, phone]);

    const subscribers = res.rows;

    for (let i = 0; i < subscribers.length; i += 1) {
      const subscriber = subscribers[i];
      await client.query(`
        DELETE FROM ${process.env.DB_SCHEMA}.subscribers WHERE id = $1
        `, [subscriber.id]);
      res = await client.query(`
        SELECT * FROM ${process.env.DB_SCHEMA}.subscriptions WHERE subscriber_id = $1
        `, [subscriber.id]);

      const subscriptions = res.rows;

      await client.query(`
        DELETE FROM ${process.env.DB_SCHEMA}.subscriptions WHERE subscriber_id = $1
        `, [subscriber.id]);

      // Now delete any orphaned cases and defendants
      for (let j = 0; j < subscriptions.length; j += 1) {
        const subscription = subscriptions[j];
        res = await client.query(`
          SELECT COUNT(*) FROM ${process.env.DB_SCHEMA}.subscriptions WHERE defendant_id = $1
          `, [subscription.defendant_id]);
        const { count } = res.rows[0];
        if (count === 0 || count === '0') {
          await client.query(`
            DELETE FROM ${process.env.DB_SCHEMA}.cases WHERE defendant_id = $1
            `, [subscription.defendant_id]);
          await client.query(`
            DELETE FROM ${process.env.DB_SCHEMA}.defendants WHERE id = $1
            `, [subscription.defendant_id]);
        }
      }
    }
  } catch (err) {
    logger.error(`Error in util/unsubscribe: ${err}`);
  }
}

module.exports = {
  unsubscribe,
};
