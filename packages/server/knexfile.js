// Update with your config settings.
require('dotenv').config()

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const host = process.env.DB_HOST
const database = process.env.DATABASE_NAME
const min = parseInt(process.env.DB_POOL_MIN, 10)
const max = parseInt(process.env.DB_POOL_MAX, 10)
const tableName = process.env.DB_MIGRATIONS_TABLE

const connection = {
  host,
  database,
  user,
  password
}

if (process.env.DB_HOST !== 'localhost') {
  connection['ssl'] =   { rejectUnauthorized: false };
}

module.exports = {
  client: 'postgresql',
  connection,
  pool: {
    min,
    max
  },
  migrations: {
    tableName
  }
};
