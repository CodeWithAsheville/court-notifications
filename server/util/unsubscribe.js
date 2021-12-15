const { knex } = require('./db');

async function unsubscribe(phone) {
  const subscribers = await knex('subscribers').select()
      .where(
        knex.raw("PGP_SYM_DECRYPT(encrypted_phone::bytea, ?) = ?", [process.env.DB_CRYPTO_SECRET, phone])
      );

  // Delete subscriber and any associated subscriptions
  try {
    for (let i=0; i<subscribers.length; ++i) {
      let subscriber = subscribers[i];
      await knex('subscribers').delete().where('id', subscriber.id);
      const subscriptions = await knex('subscriptions').where('subscriber_id', subscriber.id);
      await knex('subscriptions').delete().where('subscriber_id', subscriber.id)

      // Now delete any orphaned cases and defendants
      for (let j=0; j < subscriptions.length; ++j) {
        let subscription = subscriptions[j];
        const defendants = await knex('defendants').where('id', subscription.defendant_id);
        const count = await knex('subscriptions').where('defendant_id', subscription.defendant_id).count('*');
        if (count[0]['count'] === 0 || count[0]['count'] == '0') {
          await knex('cases').delete().where('defendant_id', subscription.defendant_id);
          await knex('defendants').delete().where('id', subscription.defendant_id);
        }
      }
    }
  }
  catch (err) {
    logger.error('Error in unsubscribe: ' + err);
  }
}

module.exports = {
  unsubscribe
}
