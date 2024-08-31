const pg = require('pg');

const { Client } = pg;

const knexConfig = require('../knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(knexConfig);

function getDBClient() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME,
    max: 10,
    idleTimeoutMillis: 10000,
  };

  return new Client(dbConfig);
}

module.exports = {
  knex,
  getDBClient,
};
