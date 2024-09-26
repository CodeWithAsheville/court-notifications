console.log('d1');
const { Client } = require('pg');
//const client = new Client()
//await client.connect()

const pgErrorCodes = import('./pgErrorCodes');
console.log('d2');

console.log('d3');

async function dbClient(dbConfig) {
  console.log('d4');
  let config = {
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME,
    max: 10,
    idleTimeoutMillis: 10000,
  };
  console.log('d5');
  if (dbConfig) config = dbConfig;
  try {
    console.log(Client);
    console.log('Now client');
    const client = new Client(config);
    console.log(client);
    return client;
  } catch (err) {
    console.log('Got an error ', err);
    const errmsg = pgErrorCodes[err.code];
    throw (new Error(errmsg));
  }
}
console.log('d6');

module.exports = { dbClient };
