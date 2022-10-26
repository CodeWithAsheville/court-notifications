require('dotenv').config();

const express = require('express');
const path = require('path');
const i18next = require('i18next');
const FsBackend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

const { searchCourtRecords } = require('./search-court-records');
const { registerSubscription } = require('./register-subscription');
const { checkSubscription } = require('./check-subscription');
const { twilioIncomingWebhook } = require('./twilio-incoming-webhook');
const { twilioSendStatusWebhook } = require('./twilio-send-status-webhook');

i18next
  .use(middleware.LanguageDetector)
  .use(FsBackend)
  .init({
    detection: {
      lookupQueryString: 'lng',
      order: ['querystring'],
      ignoreCase: true,
    },
    saveMissing: true,
    debug: false,
    fallbackLng: 'en',
    backend: {
      loadPath: path.join(__dirname, '/locales/{{lng}}/{{ns}}.json'),
      addPath: path.join(__dirname, '/locales/{{lng}}/{{ns}}.missing.json'),
    },
    nsSeparator: '#||#',
    keySeparator: '.',
  });
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(middleware.handle(i18next, {}));

if (process.env.NODE_ENV === 'production') {
  app.use((req, resp, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return resp.redirect(301, `https://${req.headers.host}/`);
    }
    return next();
  });
}

app.get('/api/version', async (req, res) => {
  let version = 'default';
  let privacyUrl = 'https://docs.google.com/document/d/19M2zCxx4gICCmjgVx1bKSHlC92Gnb2SCmkmrclLIq3Y/';
  if (req.hostname.includes('jail')) {
    version = 'jail';
    privacyUrl = 'https://docs.google.com/document/d/1YitpkjO2aJH2zwQ_m_Hx6NbhJHqK1q6g0OTKJkxeXAY/';
  } else if (req.hostname.includes('agency')) {
    version = 'agency';
  }
  const returnValue = {
    version,
    privacyUrl,
  };
  res.json(returnValue);
});

app.post('/api/court-search', async (req, res) => {
  await searchCourtRecords(req.body, (cases) => res.json(cases));
});

app.post('/api/subscribe-to-defendant', async (req, res) => {
  await registerSubscription(req, (signUpResult) => res.json(signUpResult));
});

app.get('/api/check-subscription', async (req, res) => {
  await checkSubscription(req, (checkResult) => res.json(checkResult));
});

app.post('/sms', twilioIncomingWebhook);
app.post('/send-status', twilioSendStatusWebhook);

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client/build', 'index.html'));
  });
}

module.exports = app;
