const pg = require('pg');

const { Client } = pg;

const remindersConfig = {
  host: process.env.DB_HOST,
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE_NAME,
  max: 10,
  idleTimeoutMillis: 10000,
};

function getClient(config) {
  if (!config) {
    if (process.env.DB_HOST !== 'localhost') {
      remindersConfig.ssl = {
        rejectUnauthorized: false,
      };
    }
    return new Client(remindersConfig);
  }
  return new Client(config);
}

module.exports = {
  getClient,
};
