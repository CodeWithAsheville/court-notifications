require('dotenv').config({ path: '../.env' });
const sgMail = require('@sendgrid/mail');
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const Mustache = require('mustache');
const path = require('path');
const { knex } = require('../util/db');

const { logger } = require('../util/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMessage(msg) {
  try {
    await sgMail.send(msg);
  } catch (error) {
    logger.debug(error);

    if (error.response) {
      logger.error(error.response.body);
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
        loadPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.missing.json'),
      },
    });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

async function getAgencies() {
  const agencies = await knex('agencies')
    .select(
      'agencies.id',
      'agencies.agency_name',
      'agencies.notification_day',
      // eslint-disable-next-line comma-dangle
      knex.raw('PGP_SYM_DECRYPT("agencies"."encrypted_email"::bytea, ?) as email', [process.env.DB_CRYPTO_SECRET]),
      knex.raw('subscribers.id as subscriber_id'),
    )
    .leftOuterJoin('subscribers', 'agencies.agency_name', 'subscribers.agency');
  return agencies;
}

async function getUpcomingCourtDates(agency) {
  console.log('Begin');
  console.log(agency);
  const cases = await knex('subscriptions')
    .select(
      'subscriptions.subscriber_id',
    );
  console.log('did it');
  console.log(cases);
  // .leftOuterJoin('defendants', 'subscriptions.defendant_id', 'defendants.id')
  // .leftOuterJoin('cases', 'cases.defendant_id', 'defendants.id')
  // .where('subscriptions.subscriber_id', '=', agency.subscriber_id)
  // .where('cases.court_date', '<', '2023-09-01');
  console.log('End');
}

(async () => {
  const subject = 'Buncombe County Criminal Court reminders for {{agency}} clients';
  const msg = {
    to: 'eric@deepweave.com',
    from: 'eric.jackson@democracyapps.org', // Use the email address or domain you verified above
    subject: `${Mustache.render(subject, { agency: 'Ahope' })}`,
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  await initTranslations();
  const agencies = await getAgencies();
  const today = new Date().getDay();
  console.log('Today is ', today);
  console.log(agencies);
  try {
    agencies.forEach(async (agency) => {
      console.log(agency.agency_name, ' notification day is ', agency.notification_day);
      if (agency.notification_day === today) {
        logger.debug(`Generating notification for ${agency.agency_name}`);
        const defendants = await getUpcomingCourtDates(agency);
        await sendMessage(msg);
        console.log(defendants);
      }
    });
  } catch (e) {
    console.log ('Loop failed ', e);
  }

  logger.debug('Done with agency notifications');
  process.exit();
})();
