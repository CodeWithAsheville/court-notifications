const pg = require('pg');

require('dotenv').config();

const { Client } = pg;

async function a() {
  const client = new Client({
    host: process.env.CD_DB_HOST,
    port: 5432,
    user: process.env.CD_DB_USER,
    password: process.env.CD_DB_PASSWORD,
    database: process.env.CD_DB_NAME,
    max: 10,
    idleTimeoutMillis: 10000,
  });
  await client.connect();

  try {
    const res = await client.query('SELECT * from cn.criminal_dates limit 100');
    console.log(res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

a();
