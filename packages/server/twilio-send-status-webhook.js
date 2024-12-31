const twilio = require('twilio');
const { getClient } = require('./util/db');
const { logger } = require('./util/logger');

const MAX_FAILED_DELIVERIES = 2;

async function twilioSendStatusWebhook(req, res) {
  const failedStatus = ['delivery_unknown', 'undelivered', 'failed'];
  // Make sure this is from Twilio
  const twilioSignature = req.headers['x-twilio-signature'];
  const params = req.body;
  const url = process.env.TWILIO_SEND_STATUS_WEBHOOK_URL;
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    params,
  );

  if (!isValid) {
    logger.error('twilioSendStatusWebhook: invalid incoming request - not from Twilio');
    return res.status(401).send('Unauthorized');
  }
  const status = params.SmsStatus;
  let phone = params.To;
  if (phone.startsWith('+1')) {
    phone = phone.substring(2);
  }
  logger.info(`sendStatusWebhook: incoming with status ${status}`);
  let pgClient = null;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    logger.error(`Error getting database connection in twilioSendStatusWebhook: ${err}`);
    return res.status(500).send('Internal server error');
  }

  try {
    const sql = `SELECT * FROM ${process.env.DB_SCHEMA}.subscribers
                  WHERE PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, $1) = $2`;
    let sres;

    if (status === 'delivered') {
      sres = await pgClient.query(sql, [process.env.DB_CRYPTO_SECRET, phone]);
      const subscribers = sres.rows;

      if (subscribers && subscribers.length > 0) {
        await pgClient.query(
          `UPDATE ${process.env.DB_SCHEMA}.subscribers SET status = 'confirmed', failed = 0
            WHERE PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, $1) = $2`,
          [process.env.DB_CRYPTO_SECRET, phone],
        );
      }
    } else if (failedStatus.includes(status)) {
      sres = await pgClient.query(sql, [process.env.DB_CRYPTO_SECRET, phone]);
      const subscribers = sres.rows;

      if (subscribers && subscribers.length > 0) {
        let newStatus = subscribers[0].status;
        if (subscribers[0].status === 'pending') {
          newStatus = 'failed';
          logger.error(`twilioSendStatusWebhook: Failed subscription - error code ${params.ErrorCode}`);
        } else {
          if (subscribers[0].failed >= MAX_FAILED_DELIVERIES) newStatus = 'failed';
          logger.error(`twilioSendStatusWebhook: Subscriber exceeded max delivery failures - marking failed: ${params.ErrorCode}`);
        }
        await pgClient.query(
          `UPDATE ${process.env.DB_SCHEMA}.subscribers SET status = $1, failed = $2, errorCode = $3
            WHERE PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, $4) = $5`,
          [newStatus, subscribers[0].failed + 1, params.ErrorCode,
            process.env.DB_CRYPTO_SECRET, phone],
        );
      }
    } else {
      // Nothing - just an interim status
    }
  } catch (e) {
    logger.error(`Error updating status in twilioSendStatusWebhook: ${e}`);
  } finally {
    await pgClient.end();
  }
  return res.status(200).send('OK');
}

module.exports = {
  twilioSendStatusWebhook,
};
