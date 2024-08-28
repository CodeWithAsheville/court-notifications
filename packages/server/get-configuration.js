const db = require('./util/db');

const { getDBClient } = db;

async function getConfiguration(query, callback) {
  const returnValue = {
    name: query.name,
    type: null,
    value: null,
    detail: null,
    error_message: 'Configuration value not found',
  };
  let client;
  if (query.name) {
    try {
      client = getDBClient();
      await client.connect();
      const sql = `SELECT * FROM ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`;
      const config = await client.query(sql, [query.name]);
      if (config.rows.length > 0) {
        returnValue.type = config.rows[0].type;
        returnValue.value = config.rows[0].value;
        returnValue.detail = config.rows[0].detail;
      }
      returnValue.error_message = '';
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      returnValue.error_message = (typeof e === 'string') ? e : e.message;
    } finally {
      await client.end();
    }
  }
  callback(returnValue);
}

module.exports = {
  getConfiguration,
};
