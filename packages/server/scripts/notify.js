require('dotenv').config({ path: '../.env' });
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const Mustache = require('mustache');
const path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const { getClient } = require('../util/db');
const { formatName } = require('../util/formatName');

const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;
const { logger } = require('../util/logger');

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getFormattedDate(d) {
  const dString = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return dString;
}

// Load all defendants with cases scheduled notificationDays from now
async function loadDefendants(notificationDays, pgClient) {
  const dateClause = `court_date - CURRENT_DATE = ${notificationDays}`;
  const sql = `
    SELECT c.defendant_id, c.case_number, c.court_date, c.court, c.room, c.session,
           d.first_name, d.middle_name, d.last_name, d.suffix, d.birth_date
      FROM ${process.env.DB_SCHEMA}.cases c LEFT OUTER JOIN ${process.env.DB_SCHEMA}.defendants d
      ON c.defendant_id = d.id
      WHERE ${dateClause}
  `;
  const res = await pgClient.query(sql);
  const results = res.rows;

  const defendantHash = {};
  results.forEach((d) => {
    // First time for this defendant - initialize in the hash
    const id = d.defendant_id;
    if (!(d.defendant_id in defendantHash)) {
      const courtDate = new Date(d.court_date);
      defendantHash[id] = {
        id,
        name: formatName(d.first_name, d.middle_name, d.last_name, d.suffix),
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
        superiorRooms: {},
      };
    }
    // Add the case information to the cases array
    defendantHash[id].cases.push({
      case_number: d.case_number,
      court: d.court,
      room: d.room,
    });
    // Count the cases in each court for the notification
    if (d.court.toLowerCase() === 'district') {
      if (d.room.toLowerCase() === 'admn') {
        defendantHash[id].adminCount += 1;
      } else {
        defendantHash[id].districtCount += 1;
        defendantHash[id].districtRooms[d.room] = d.room;
      }
    } else {
      defendantHash[id].superiorCount += 1;
      defendantHash[id].superiorRooms[d.room.toLowerCase()] = d.room;
    }
  });

  const defendants = [];
  const keys = Object.keys(defendantHash);
  keys.forEach((dID) => {
    defendants.push(defendantHash[dID]);
  });
  return defendants;
}

async function loadSubscribers(defendantId, pgClient) {
  const sql = `SELECT subscriptions.defendant_id, subscriptions.subscriber_id, subscribers.language,
            PGP_SYM_DECRYPT("subscribers"."encrypted_phone"::bytea, $1) as phone
      FROM ${process.env.DB_SCHEMA}.subscriptions
      LEFT OUTER JOIN ${process.env.DB_SCHEMA}.subscribers
      ON subscriptions.subscriber_id = subscribers.id
      WHERE subscriptions.defendant_id = $2`;
  const res = await pgClient.query(
    sql,
    [process.env.DB_CRYPTO_SECRET, defendantId],
  );
  return res.rows;
}

async function logNotification(defendant, notification, language, pgClient) {
  for (let i = 0; i < defendant.cases.length; i += 1) {
    const c = defendant.cases[i];
    // eslint-disable-next-line no-await-in-loop
    await pgClient.query(
      `
      INSERT INTO ${process.env.DB_SCHEMA}.log_notifications
        (tag, days_before, first_name, middle_name, last_name, suffix,
        birth_date, district_count, superior_count, case_number, language,
        court, room) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [notification.key, notification.days_before, defendant.first_name,
        defendant.middle_name ? defendant.middle_name : '', defendant.last_name,
        defendant.suffix ? defendant.suffix : '', defendant.birth_date,
        defendant.districtCount, defendant.superiorCount, c.case_number, language,
        c.court, c.room],
    );
  }
}

async function sendNotifications() {
  let pgClient;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    logger.error('Error getting database client in sendNotifications', err);
    throw err;
  }
  try {
    const res = await pgClient.query(`SELECT * from ${process.env.DB_SCHEMA}.notify_configuration`);
    const notificationSets = res.rows;

    /*
    * Each notificationSet is a specific message to be sent
    * a specific number of days before the court date
    */
    for (let i = 0; i < notificationSets.length; i += 1) {
      try {
        logger.info(`Send notifications for court dates in ${notificationSets[i].days_before} days`);
        const notificationDays = notificationSets[i].days_before;
        const msgKey = notificationSets[i].key;
        // eslint-disable-next-line no-await-in-loop
        const defendants = await loadDefendants(notificationDays, pgClient);

        for (let j = 0; j < defendants.length; j += 1) {
          const defendant = defendants[j];
          try {
            // eslint-disable-next-line no-await-in-loop
            const subscribers = await loadSubscribers(defendant.id, pgClient);

            // And send out the notifications
            for (let k = 0; k < subscribers.length; k += 1) {
              const s = subscribers[k];
              try {
                // Log the notification
                // eslint-disable-next-line no-await-in-loop
                await logNotification(defendant, notificationSets[i], s.language, pgClient);
                // eslint-disable-next-line no-await-in-loop
                await i18next.changeLanguage(s.language);
                let message = `${Mustache.render(i18next.t(msgKey), defendant)}\n\n`;
                if (defendant.adminCount > 0) {
                  message += Mustache.render(i18next.t('notifications.admin-court'), defendant);
                }
                if (defendant.districtCount > 0) {
                  message += Mustache.render(i18next.t('notifications.district-court'), defendant);
                  let sep = '';
                  const keys = Object.keys(defendant.districtRooms);
                  keys.forEach((room) => {
                    message += sep + room;
                    sep = ', ';
                  });
                  message += '\n';
                }

                if (defendant.superiorCount > 0) {
                  message += Mustache.render(i18next.t('notifications.superior-court'), defendant);
                }

                message += `\n\n${i18next.t('notifications.reminder-final')}`;
                const msgObject = {
                  body: message,
                  from: fromTwilioPhone,
                  to: s.phone,
                };
                // eslint-disable-next-line no-await-in-loop
                await client.messages
                  .create(msgObject)
                  .then((sentMessage) => logger.debug(JSON.stringify(sentMessage.body)));
              } catch (err) {
                if (err === 'Attempt to send to unsubscribed recipient') {
                  logger.error(`Subscriber ${s.subscriber_id} to defendant ${defendant.id} has opted out`);
                } else {
                  logger.error(`Error processing notifications for subscriber ${s.subscriber_id}, defendant ${defendant.id}`, err);
                }
              }
            }
          } catch (err) {
            logger.error(`Error processing notifications for defendant ${defendant.id}`, err);
          }
        }
      } catch (err) {
        logger.error(`Error sending notification set ${i}`, err);
      }
    }
  } catch (err) {
    logger.error('Error sending notifications ', err);
  } finally {
    await pgClient.end();
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
        loadPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.missing.json'),
      },
    });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

// Invoke
(async () => {
  logger.info('Sending court date notifications');
  await initTranslations();
  await sendNotifications();
  logger.info('Done sending court date notifications');
  process.exit();
})();
