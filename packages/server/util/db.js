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
    return new Client(remindersConfig);
  }
  return new Client(config);
}

/*
 * Delete this & next 3 lines plus the knex export
 * when knex is no longer needed.
 */
const knexConfig = require('../knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(knexConfig);

module.exports = {
  getClient,
  knex,
};
