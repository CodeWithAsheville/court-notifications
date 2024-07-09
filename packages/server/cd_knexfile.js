// This is the knex configuration for the new court dates DB in AWS
// Update with your config settings.
require('dotenv').config();

const user = process.env.CD_DB_USER;
const password = process.env.CD_DB_PASSWORD;
const host = process.env.CD_DB_HOST;
const database = process.env.CD_DB_NAME;
const min = parseInt(process.env.DB_POOL_MIN, 10);
const max = parseInt(process.env.DB_POOL_MAX, 10);

const connection = {
  host,
  database,
  user,
  password,
};

if (process.env.DB_HOST !== 'localhost') {
  connection.ssl = { rejectUnauthorized: false };
}

module.exports = {
  client: 'postgresql',
  connection,
  pool: {
    min,
    max,
  },
};
