const knexConfig = require('../knexfile');
var knex        = require('knex')(knexConfig);
var Mustache = require('mustache');
var { unsubscribe } = require('./scripts/unsubscribe');
const { computeUrlName } = require('./scripts/computeUrlName');
const { logger } = require('./scripts/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

function initializeDefendant(body) {
  const selectedDefendant = body.selectedDefendant;
  const details = body.details;

  const defendant = {
    long_id: selectedDefendant,
    last_name: '',
    first_name: '',
    middle_name: null,
    suffix: null,
    birth_date: ''
  };
  defendant.birth_date = details.dob;
  const d = details.defendant.split(',');
  defendant.last_name = d[0];
  if (d.length >= 2) {
    defendant.first_name = d[1];
    if (d.length >= 3) { //TODO Could be lname,fname,suffix
      defendant.middle_name = d[2];
      if (d.length >= 4) {
        defendant.suffix = d[3];
      }
    }
  }
  return defendant;
}

async function addDefendant(defendant) {
  const defendantId = await knex('defendants')
  .select()
    .where('long_id', defendant.long_id)
    .then(async function(rows) {
      if (rows.length===0) {
        // no matching records found
        const retVal = await knex('defendants')
          .insert(defendant)
          .returning('id');
        if (retVal && retVal.length > 0) {
          return retVal[0]
        }
        throw new Error('Error inserting defendant ' + JSON.stringify(retVal));
      } else {
        return rows[0].id;
      }
    })
    .catch(function(ex) {
      // you can find errors here.
      throw 'Error adding or updating defendant';
    });

    return defendantId;
}

async function addCases(defendantId, casesIn) {
  let nextDate = null;
  const cases = casesIn.map(itm => {
    const cdate = new Date(itm.courtDate);
    if (nextDate === null || cdate < nextDate) nextDate = cdate;
    return {
      defendant_id: defendantId,
      case_number: itm.caseNumber,
      court_date: itm.courtDate,
      court: itm.court,
      room: itm.courtRoom,
      session: itm.session,
    }
  });
  try {
    // We could compare existing cases in DB to new ones, but ... why?
    let retVal = await knex('cases')
      .where('defendant_id', cases[0].defendant_id)
      .del();

    retVal = await knex('cases')
      .insert(cases)
      .returning('id');
  }
  catch (e) {
    throw 'Error adding or updating cases for subscription';
  }
  return nextDate;
}

async function addSubscriber(nextDate, phone, language) {
  const nextNotify = (nextDate.getMonth()+1) + '/' + nextDate.getDate() + '/' + nextDate.getFullYear();
  let subscriberId = null;
  let subscribers = null;
  try {
    subscribers = await knex('subscribers').select()
      .where(
        knex.raw("PGP_SYM_DECRYPT(encrypted_phone::bytea, ?) = ?", [process.env.DB_CRYPTO_SECRET, phone])
      )
  }
  catch (e) {
    logger.error(e)
    throw 'Error in subscriber lookup';
  }
  if (subscribers.length > 0) { // We already have this subscriber, update the date if needed
    subscriberId = subscribers[0].id;
    const currentNext = new Date(subscribers[0].next_notify);
    if (nextDate != currentNext) { // Need to update the date
      try {
        knex('subscribers').where('id', subscriberId).update({
          next_notify: nextNotify,
        });
      }
      catch (e) {
        throw 'Error updating next court date';
      }
    }
  }
  else { // New subscriber
    try {
      let retVal = await knex('subscribers').insert({
          encrypted_phone: knex.raw("PGP_SYM_ENCRYPT(?::text, ?)", [phone, process.env.DB_CRYPTO_SECRET]),
          language,
          next_notify: nextNotify,
          status: 'pending',
        })
        .returning('id');
      subscriberId = retVal[0];
    }
    catch (e) {
      logger.error(e)
      throw 'Error adding subscriber';
    }
  }
  return subscriberId;
}

async function addSubscription(subscriberId, defendantId) {
  try {
    let retVal = await knex('subscriptions').select().where({
      subscriber_id: subscriberId,
      defendant_id: defendantId
    });
    if (retVal.length === 0) {
      await knex('subscriptions').insert({
          subscriber_id: subscriberId,
          defendant_id: defendantId
        });
    }
  }
  catch (e) {
    throw 'Error adding subscription';
  }
}

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
  logger.debug('Adding a new subscription');
  let subscriberId = null;
  try {
    const phone = body.phone_number.replace(/\D/g,'');
    let cases = body.details.cases;
    if (cases == null || cases.length == 0) throw req.t("no-cases");

    const defendant  = initializeDefendant(body);
    let defendantId  = await addDefendant(defendant);
    const nextDate   = await addCases(defendantId, cases);
    subscriberId = await addSubscriber(nextDate, phone, req.language);

    await addSubscription(subscriberId, defendantId);

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
  console.log('Calling back');
  callback({message: returnMessage, code: returnCode, index: subscriberId });
}
module.exports = {
  registerSubscription,
  addCases
}