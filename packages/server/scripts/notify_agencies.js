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
  // return agencies.map((agency) => ({
  //   ...agency,
  //   tr: null,
  // }));
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
  agencies.forEach((agency) => {
    console.log(agency);
    if (agency.notification_day === today) {
      console.log('And today is the day!');
    }
  });

  logger.debug('Call sendMessage');
  await sendMessage(msg);
  logger.debug('Done with agency notifications');
  process.exit();
})();
