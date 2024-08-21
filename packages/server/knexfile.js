// Update with your config settings.
require('dotenv').config();

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const database = process.env.DATABASE_NAME;
const schema = process.env.DB_SCHEMA;

const min = parseInt(process.env.DB_POOL_MIN, 10);
const max = parseInt(process.env.DB_POOL_MAX, 10);
const tableName = process.env.DB_MIGRATIONS_TABLE;

const connection = {
  host,
  database,
  user,
  password,
  searchPath: [schema],
  // searchPath: [schema, 'public'],
};

if (process.env.DB_HOST !== 'localhost') {
  connection.ssl = { rejectUnauthorized: false };
}

const knexObject = {
  client: 'postgresql',
  connection,
  pool: {
    min,
    max,
  },
  migrations: {
    tableName,
    schemaName: schema,
  },
};

module.exports = knexObject;
