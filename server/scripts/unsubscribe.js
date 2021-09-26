const knex = require('knex')(knexConfig);

async function unsubscribe(phone) {
  const subscribers = await knex('subscribers').where('phone', phone);
  // Delete subscriber and any associated descriptions
  subscribers.forEach(async subscriber => {
    await knex('subscribers').delete().where('id', subscriber.id);
    const subscriptions = await knex('subscriptions').where('subscriber_id', subscriber.id);
    await knex('subscriptions').delete().where('subscriber_id', subscriber.id)

    // Now delete any orphaned cases and defendants
    subscriptions.forEach(async subscription => {
      const defendants = await knex('defendants').where('id', subscription.defendant_id);
      const count = await knex('subscriptions').where('defendant_id', subscription.defendant_id).count('*');
      if (count[0]['count'] === 0 || count[0]['count'] == '0') {
        await knex('cases').delete().where('defendant_id', subscription.defendant_id);
        await knex('defendants').delete().where('id', subscription.defendant_id);
      }
    });
  });
}
