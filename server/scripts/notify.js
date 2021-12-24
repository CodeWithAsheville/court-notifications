require('dotenv').config({ path: '../../.env'});
const i18next = require('i18next');
var FsBackend = require('i18next-fs-backend');

const { knex } = require('../util/db');

var Mustache = require('mustache');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;
const { logger } = require('../util/logger');
const { computeUrlName } = require('../util/computeUrlName');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getFormattedDate(d) {
  const dString = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  return dString;
}

// Load all defendants with cases scheduled notificationDays from now
async function loadDefendants(notificationDays) {
  let dateClause = 'court_date - CURRENT_DATE = ' + notificationDays
  const results = await knex('cases')
    .select('cases.defendant_id', 'cases.case_number', 'cases.court_date', 'cases.court', 'cases.room', 'cases.session', 'defendants.first_name', 'defendants.middle_name', 'defendants.last_name', 'defendants.suffix', 'defendants.birth_date')
    .leftOuterJoin('defendants', 'cases.defendant_id', 'defendants.id')
    .whereRaw(dateClause)

  const defendantHash = {};
  const nameTemplate = '{{fname}} {{mname}} {{lname}} {{suffix}}'
  results.forEach(d => {
    const name = {
      fname: d.first_name,
      mname: d.middle_name ? d.middle_name : '',
      lname: d.last_name,
      suffix: d.suffix ? d.suffix : ''
    }
    // First time for this defendant - initialize in the hash
    const id = d.defendant_id;
    if (!(d.defendant_id in defendantHash)) {
      const courtDate = new Date(d.court_date);
      defendantHash[id] = {
        id,
        name: Mustache.render(nameTemplate, name),
        first_name: d.first_name,
        middle_name: d.middle_name,
        last_name: d.last_name,
        suffix: d.suffix,
        birth_date: d.birth_date,
        date: getFormattedDate(courtDate),
        cases: [],
        adminCount: 0,
        districtCount: 0,
        districtRooms: {},
        superiorCount: 0,
        superiorRooms: {}
      }
    }
    // Add the case information to the cases array
    defendantHash[id].cases.push({
      case_number: d.case_number,
      court: d.court,
      room: d.room
    })
    // Count the cases in each court for the notification
    if (d.court.toLowerCase() === 'district') {
      if (d.room.toLowerCase() === 'admn') {
        ++defendantHash[id].adminCount
      }
      else {
        ++defendantHash[id].districtCount;
        defendantHash[id].districtRooms[d.room] = d.room;
      }
    }
    else {
      ++defendantHash[id].superiorCount;
      defendantHash[id].superiorRooms[d.room.toLowerCase()] = d.room;
    }
  });
  const defendants = [];
  for (dID in defendantHash) {
    defendants.push(defendantHash[dID]);
  }
  return defendants
}

function loadSubscribers(defendantId) {
  return knex('subscriptions')
      .select('subscriptions.defendant_id', 'subscriptions.subscriber_id', 'subscribers.language',
      knex.raw('PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, ?) as phone', [process.env.DB_CRYPTO_SECRET]))
      .leftOuterJoin('subscribers', 'subscriptions.subscriber_id', 'subscribers.id')
      .where('subscriptions.defendant_id', '=', defendantId);  
}


async function logNotification(defendant, notification, language) {
  const notify_inserts = defendant.cases.map(c => {
    return {
      tag: notification.key,
      days_before: notification.days_before,
      first_name: defendant.first_name,
      middle_name: defendant.middle_name ? defendant.middle_name : '',
      last_name: defendant.last_name,
      suffix: defendant.suffix ? defendant.suffix : '',
      birth_date: defendant.birth_date,
      district_count: defendant.districtCount,
      superior_count: defendant.superiorCount,
      case_number: c.case_number,
      language,
      court: c.court,
      room: c.room
    };
  });
  await knex('log_notifications').insert(notify_inserts);
}

async function sendNotifications() {
  const client = require('twilio')(accountSid, authToken);

  const notificationSets = await knex('notify_configuration').select('*');

  /*
   * Each notificationSet is a specific message to be sent
   * a specific number of days before the court date
   */
  for (i = 0; i < notificationSets.length; ++ i) {
    logger.debug('Do notifications for ' + notificationSets[i].days_before + ' days');
    const notificationDays = notificationSets[i].days_before;
    const msgKey = notificationSets[i].key;
    const defendants = await loadDefendants(notificationDays);

    for (j = 0; j < defendants.length; ++j) {
      defendant = defendants[j];
      const subscribers = await loadSubscribers(defendant.id)

      // And send out the notifications
      for (k = 0; k < subscribers.length; ++k) {
        const s = subscribers[k];
        // Log the notification
        await logNotification(defendant, notificationSets[i], s.language);
        await i18next.changeLanguage(s.language);
        let message = Mustache.render(i18next.t(msgKey), defendant) + '\n\n';
        if (defendant.adminCount > 0) {
          message += Mustache.render(i18next.t('notifications.admin-court'), defendant);
        }
        if (defendant.districtCount > 0) {
          message += Mustache.render(i18next.t('notifications.district-court'), defendant);
          let sep = '';
          for (const room in defendant.districtRooms) {
            message += sep + room;
            sep = ', ';
          }
          message += '\n';
        }
        if (defendant.superiorCount > 0) {
          message += Mustache.render(i18next.t('notifications.superior-court'), defendant);
        }
        const defendantDetails = {
          county: 100,
          urlname: computeUrlName(defendant)
        }
        message += '\n\n' + Mustache.render(i18next.t('notifications.reminder-final'), defendantDetails);
        const msgObject = {
          body: message,
          from: fromTwilioPhone,
          to: s.phone
        };
        await client.messages
        .create(msgObject)
        .then(sentMessage => logger.debug(JSON.stringify(sentMessage.body)));
      }
    }
  }
}

async function initTranslations() {
  await i18next
  .use(FsBackend)
  .init({
    saveMissing: false,
    debug: false,
    fallbackLng: 'en',
    backend: {
      loadPath: __dirname + '/../locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/../locales/{{lng}}/{{ns}}.missing.json'
    }
  });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

// Invoke
(async() => {
  await initTranslations();
  logger.debug('Call notifications');
  await sendNotifications();
  logger.debug('Done with notifications');
  process.exit();
})();


