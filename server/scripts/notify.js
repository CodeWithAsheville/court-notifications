require('dotenv').config({ path: '../../.env'});
const i18next = require('i18next');
var FsBackend = require('i18next-fs-backend');

const knexConfig = require('../../knexfile');
var knex        = require('knex')(knexConfig);
var Mustache = require('mustache');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromTwilioPhone = process.env.TWILIO_PHONE_NUMBER;

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getFormattedDate(d) {
  const dString = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  return dString;
}

async function notifications() {
  const client = require('twilio')(accountSid, authToken);

  await i18next.changeLanguage('en');
  console.log(i18next.t('no-cases'));
  await i18next.changeLanguage('ru');
  console.log(i18next.t('no-cases'));
  await i18next.changeLanguage('es');
  console.log(i18next.t('no-cases'));
  const notificationSets = await knex('notify_configuration').select('*');
  for (i = 0; i < notificationSets.length; ++ i) {
    console.log('Doing notifications for ' + notificationSets[i].days_before + ' days in advance');
    const notificationDays = notificationSets[i].days_before;
    const notificationText = notificationSets[i].text;
    let dateClause = 'court_date - CURRENT_DATE = ' + notificationDays
    const results = await knex('cases')
      .select('cases.defendant_id', 'cases.case_number', 'cases.court_date', 'cases.room', 'cases.session', 'defendants.first_name', 'defendants.middle_name', 'defendants.last_name', 'defendants.suffix')
      .leftOuterJoin('defendants', 'cases.defendant_id', 'defendants.id')
      .whereRaw(dateClause)

    // First, get all the defendants and their cases and set up the text for them
    const defendantHash = {};
    const nameTemplate = '{{fname}} {{mname}} {{lname}} {{suffix}}'
    results.forEach(d => {
      const name = {
        fname: d.first_name,
        mname: d.middle_name ? d.middle_name : '',
        lname: d.last_name,
        suffix: d.suffix ? d.suffix : ''
      }
      if (!(d.defendant_id in defendantHash)) {
        const courtDate = new Date(d.court_date);
        defendantHash[d.defendant_id] = {
          name: Mustache.render(nameTemplate, name),
          date: getFormattedDate(courtDate),
          cases: []
        }
      }
      defendantHash[d.defendant_id].cases.push({
        case_number: d.case_number,
        room: d.room,
        session: d.session
      })
    });
    const caseTemplate = '  Case {{case_number}}, Room: {{room}}, Session: {{session}}\n'
    const defendants = []
    for (dID in defendantHash) {
      const d = defendantHash[dID];
      let txt = Mustache.render(notificationText, d) + '\n';
      d.cases.forEach(c => {
        txt += Mustache.render(caseTemplate, c)
      });
      defendants.push({ id: dID, text: txt })
    }
    // Now  loop through defendants, get subscriptions, and notify
    for (j = 0; j < defendants.length; ++j) {
      d = defendants[j];
      const subscribers = await knex('subscriptions')
      .select('subscriptions.defendant_id', 'subscriptions.subscriber_id',
      knex.raw("PGP_SYM_DECRYPT(subscribers.encrypted_phone::bytea, ?) as phone", [process.env.DB_CRYPTO_SECRET]))
      .leftOuterJoin('subscribers', 'subscriptions.subscriber_id', 'subscribers.id')
      .where('subscriptions.defendant_id', '=', d.id);

      // And send out the notifications
      for (k = 0; k < subscribers.length; ++k) {
        const s = subscribers[k];
        const msgObject = {
          body: d.text,
          from: fromTwilioPhone,
          to: s.phone
        };
        await client.messages
        .create(msgObject)
        .then(message => console.log(message));
      }
    }
  }
}

// readyToNotify(18)

async function initTranslations() {
  await i18next
  .use(FsBackend)
  .init({
    saveMissing: false,
    debug: true,
    fallbackLng: 'en',
    backend: {
      loadPath: __dirname + '/../locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/../locales/{{lng}}/{{ns}}.missing.json'
    },
    nsSeparator: '#||#',
    keySeparator: '#|#'
  });
  return i18next.loadLanguages(['en', 'es', 'ru']);
}

// 
(async() => {
  console.log(__dirname);
  await initTranslations();
  console.log('Call notifications');
  await notifications();
  console.log('Done with notifications');
  process.exit();
})();


