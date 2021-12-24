const { knex } = require('./util/db');
var Mustache = require('mustache');
const { unsubscribe } = require('./util/unsubscribe');
const { subscribe } = require('./util/subscribe');
const { computeUrlName } = require('./util/computeUrlName');
const { logger } = require('./util/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

async function logSubscription(defendant, cases, language) {
  const caseInserts = cases.map(c => {
    return {
      first_name: defendant.first_name,
      middle_name: defendant.middle_name ? defendant.middle_name : '',
      last_name: defendant.last_name,
      suffix: defendant.suffix ? defendant.suffix : '',
      birth_date: defendant.birth_date,
      case_number: c.caseNumber,
      language,
      court: c.court,
      room: c.courtRoom
    };
  });
  await knex('log_subscriptions').insert(caseInserts);
}

async function registerSubscription(req, callback) {
  let returnMessage = req.t("signup-success");
  let returnCode = 200;
  const body = req.body;
  let subscriberId = null;
  let defendant = null;
  let cases = [];
  logger.debug('Adding a new subscription');
  try {
    const phone = body.phone_number.replace(/\D/g,'');
    ({ defendant, subscriberId, cases } = await subscribe(phone, body.selectedDefendant, body.details, req.t, req.language));
    // Now send a verification message to the user
    const client = require('twilio')(accountSid, authToken);
    const nameTemplate = req.t("name-template");
    const defendantDetails = {
      fname: defendant.first_name,
      mname: defendant.middle_name ? defendant.middle_name : '',
      lname: defendant.last_name,
      suffix: defendant.suffix ? defendant.suffix : '',
      county: 100,
      urlname: computeUrlName(defendant)
    }

    let msg = Mustache.render(nameTemplate, defendantDetails);
    try {
      await client.messages
          .create({
            body: msg,
            from: fromTwilioPhone,
            statusCallback: process.env.TWILIO_SEND_STATUS_WEBHOOK_URL,
            to: phone
          })
          .then(async function(message) {
            logger.debug('Successfully sent subscription confirmation: ' + message.body);
            logSubscription(defendant, cases, req.language);
          });
    } catch (e) {
      unsubscribe(phone);
      if (e.code === 21610) {
        msg = Mustache.render(req.t("error-start"), { phone: process.env.TWILIO_PHONE_NUMBER});
        throw msg;
      }
      msg = req.t("error-unknown") + ' ' + e.message + '(' + e.code + ')';
      logger.error(msg);
      throw msg;
    }
  }
  catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
    returnCode = 500;
  }
  callback({message: returnMessage, code: returnCode, index: subscriberId });
}
module.exports = {
  registerSubscription
}