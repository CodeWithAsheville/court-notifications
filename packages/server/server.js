require('dotenv').config()

const express = require("express");

var i18next = require('i18next');
var FsBackend = require('i18next-fs-backend');
var middleware = require('i18next-http-middleware');

const { knex } = require('./util/db');

const MessagingResponse = require('twilio').twiml.MessagingResponse;

const { searchCourtRecords } = require("./search-court-records");
const { registerSubscription } = require("./register-subscription");
const { checkSubscription } = require('./check-subscription');
const { twilioIncomingWebhook } = require('./twilio-incoming-webhook');
const { twilioSendStatusWebhook } = require('./twilio-send-status-webhook');

const path = require("path");

i18next
.use(middleware.LanguageDetector)
.use(FsBackend)
  .init({
    detection: {
      lookupQueryString: 'lng',
      order: ['querystring'],
      ignoreCase: true
    },
    saveMissing: true,
    debug: false,
    fallbackLng: 'en',
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json',
      addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    nsSeparator: '#||#',
    keySeparator: '#|#'
  });
const app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(middleware.handle(i18next, {}));

if (process.env.NODE_ENV === "production") {
  app.use(function(req, resp, next){
    if (req.headers['x-forwarded-proto'] == 'http') {
        return resp.redirect(301, 'https://' + req.headers.host + '/');
    } else {
        return next();
    }
  });
}

app.post("/api/court-search", (req, res) => {
  searchCourtRecords(req.body, (cases) => res.json(cases));
});

app.post("/api/subscribe-to-defendant", (req, res) => {
  registerSubscription(req, (signUpResult) => res.json(signUpResult));
});

app.get("/api/check-subscription", (req, res) => {
  checkSubscription(req, (checkResult) => res.json(checkResult))
});

app.post('/sms', twilioIncomingWebhook);
app.post('/send-status', twilioSendStatusWebhook);

if (process.env.NODE_ENV === "production") {
  // Serve any static files
  app.use(express.static(path.join(__dirname, "../client/build")));

  // Handle React routing, return all requests to React app
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "..", "client/build", "index.html"));
  });
}

module.exports = app;
