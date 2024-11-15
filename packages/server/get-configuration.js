const { getClient } = require('./util/db');

async function getConfiguration (query, callback) {
  const returnValue = {
    name: query.name,
    type: null,
    value: null,
    detail: null,
    error_message: 'Configuration value not found',
  };
  let pgClient;
  if (query.name) {
    console.log('Query name is ', query.name);
    try {
      pgClient = getClient();
      await pgClient.connect();
    } catch (err) {
      returnValue.error_message = (typeof err === 'string') ? err : err.message;
    }
    try {
      const res = await pgClient.query(`SELECT * FROM ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`, [query.name]);
      const config = res.rows;
      if (config.length > 0) {
        returnValue.type = config[0].type;
        returnValue.value = config[0].value;
        returnValue.detail = config[0].detail;
      }
      returnValue.error_message = '';
    } catch (err) {
      returnValue.error_message = (typeof err === 'string') ? err : err.message;
    } finally {
      await pgClient.end();
    }
  }
  callback(returnValue);
}

module.exports = {
  getConfiguration,
};
