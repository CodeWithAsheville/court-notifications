const Mustache = require('mustache');
const { knex } = require('./util/db');
const { unsubscribe } = require('./util/unsubscribe');
const { subscribe } = require('./util/subscribe');
const { computeUrlName } = require('./util/computeUrlName');
const { logger } = require('./util/logger');
const { twilioClient } = require('./util/twilio-client');

const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

async function logSubscription(defendant, cases, language) {
  const caseInserts = cases.map((c) => {
    const oneCase = {
      first_name: defendant.first_name,
      middle_name: defendant.middle_name ? defendant.middle_name : '',
      last_name: defendant.last_name,
      suffix: defendant.suffix ? defendant.suffix : '',
      birth_date: defendant.birth_date,
      case_number: c.caseNumber,
      language,
      court: c.court,
      room: c.courtRoom,
    };
    return oneCase;
  });
  await knex('log_subscriptions').insert(caseInserts);
}

async function sendVerificationMessage(defendant, phone, cases, req) {
  // Now send a verification message to the user
  const nameTemplate = req.t('name-template');
  const unsubInfo = req.t('unsubscribe.signup');

  const defendantDetails = {
    fname: defendant.first_name,
    mname: defendant.middle_name ? defendant.middle_name : '',
    lname: defendant.last_name,
    suffix: defendant.suffix ? defendant.suffix : '',
    county: 100,
    urlname: computeUrlName(defendant),
  };
  if (
    process.env.NODE_ENV === 'production'
    || process.env.DISABLE_SMS !== 'true'
  ) {
    const defMessage = Mustache.render(nameTemplate, defendantDetails);
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
          logger.debug(`Successfully sent subscription confirmation: ${message.body}`);
          await logSubscription(defendant, cases, req.language);
        });
    } catch (e) {
      await unsubscribe(phone);
      if (e.code === 21610) {
        msg = Mustache.render(req.t('error-start'), { phone: process.env.TWILIO_PHONE_NUMBER });
        throw msg;
      }
      msg = `${req.t('error-unknown')} ${e.message} (${e.code})`;
      logger.error(`Error in register-subscription.js: ${e.message} (${e.code})`);
      throw msg;
    }
  }
}

async function registerSubscription(req, callback) {
  let returnMessage = req.t('signup-success');
  let returnCode = 200;
  const { body } = req;
  let subscriberId = null;
  const { agency } = body;
  let defendant = null;
  let cases = [];
  logger.debug('Adding a new subscription');
  try {
    const phone = body.phone_number.replace(/\D/g, '');
    // Do we want to have some validation here?
    ({ defendant, subscriberId, cases } = await subscribe(
      phone,
      body.selectedDefendant,
      body.details,
      req.t,
      req.language,
      agency,
    ));
    if (phone && !agency) await sendVerificationMessage(defendant, phone, cases, req);
  } catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
    returnCode = 500;
  }
  callback({ message: returnMessage, code: returnCode, index: subscriberId });
}

module.exports = {
  registerSubscription,
};
