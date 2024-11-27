const Mustache = require('mustache');
const { getClient } = require('./util/db');
const { unsubscribe } = require('./util/unsubscribe');
const { subscribe } = require('./util/subscribe');
const { logger } = require('./util/logger');
const { formatName } = require('./util/formatName');
const { twilioClient } = require('./util/twilio-client');

const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

async function logSubscription(defendant, cases, language) {
  let pgClient;
  let saveError = null;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    logger.error('Error getting database client in register-subscription', err);
    throw err;
  }
  try {
    for (let i = 0; i < cases.length; i += 1) {
      const c = cases[i];
      // eslint-disable-next-line no-await-in-loop
      await pgClient.query(
        `INSERT INTO ${process.env.DB_SCHEMA}.log_subscriptions
          (first_name, middle_name, last_name, suffix, birth_date, case_number, language, court, room)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [defendant.first_name, defendant.middle_name, defendant.last_name, defendant.suffix ? defendant.suffix : '',
          defendant.birth_date, c.caseNumber, language, c.court, c.courtRoom],
      );
    }
  } catch (err) {
    saveError = err;
  } finally {
    await pgClient.end();
  }
  if (saveError) {
    logger.error(`Error in register-subscription: ${saveError}`);
  }
}

async function registerSubscription(req, callback) {
  let returnMessage = req.t('signup-success');
  let returnCode = 200;
  const { body } = req;
  let subscriberId = null;
  let defendant = null;
  let cases = [];
  try {
    const phone = body.phone_number.replace(/\D/g, '');
    logger.info(`Adding a new subscription with phone ending in ${phone.substring(phone.length - 4)}`);
    ({ defendant, subscriberId, cases } = await subscribe(
      phone,
      body.selectedDefendant,
      body.details,
      req.t,
      req.language,
    ));
    // Now send a verification message to the user
    const nameTemplate = req.t('name-template');
    const unsubInfo = req.t('unsubscribe.signup');
    const name = formatName(
      defendant.first_name,
      defendant.middle_name,
      defendant.last_name,
      defendant.suffix,
    );

    if (
      process.env.NODE_ENV === 'production'
      || process.env.DISABLE_SMS !== 'true'
    ) {
      const defMessage = Mustache.render(nameTemplate, { name });
      let msg = `${defMessage}\n\n ${unsubInfo}`;
      try {
        await twilioClient.messages
          .create({
            body: msg,
            from: fromTwilioPhone,
            statusCallback: process.env.TWILIO_SEND_STATUS_WEBHOOK_URL,
            to: phone,
          })
          .then(async (message) => {
            logger.info(`Successfully sent subscription confirmation: ${message.body}`);
            await logSubscription(defendant, cases, req.language);
          });
      } catch (e) {
        await unsubscribe(phone, 'Failed register-subscription');
        if (e.code === 21610) {
          msg = Mustache.render(req.t('error-start'), { phone: process.env.TWILIO_PHONE_NUMBER });
          throw msg;
        }
        msg = `${req.t('error-unknown')} ${e.message} (${e.code})`;
        logger.error(`Error in register-subscription.js: ${e.message} (${e.code})`);
        throw msg;
      }
    }
  } catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
    returnCode = 500;
  }
  callback({ message: returnMessage, code: returnCode, index: subscriberId });
}
module.exports = {
  registerSubscription,
};
