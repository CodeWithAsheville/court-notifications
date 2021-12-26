const { knex } = require('./db');

async function getSubscriberStatus(phone) {
  let status = 'unknown';
  const subscribers = await knex('subscribers')
  .where(
    knex.raw("PGP_SYM_DECRYPT(encrypted_phone::bytea, ?) = ?", [process.env.DB_CRYPTO_SECRET, phone])
  );
  if (subscribers && subscribers.length > 0) {
    status = subscribers[0].status;
  }
  return status;
}

module.exports = {
  getSubscriberStatus
}
