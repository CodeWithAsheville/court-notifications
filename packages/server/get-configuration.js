const { getClient } = require('./util/db');
const { logger } = require('./util/logger');

async function getConfiguration(query, callback) {
  console.log('Getting configuration: ', query);
  const returnValue = {
    name: query.name,
    type: null,
    value: null,
    detail: null,
    error_message: 'Configuration value not found',
  };
  let pgClient;
  if (query.name) {
    try {
      pgClient = getClient();
      await pgClient.connect();
    } catch (err) {
      returnValue.error_message = (typeof err === 'string') ? err : err.message;
    }
    try {
      const res = await pgClient.query(`SELECT * FROM ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`, [query.name]);
      const config = res.rows;
      console.log('Result: ', config);
      if (config.length > 0) {
        returnValue.type = config[0].type;
        returnValue.value = config[0].value;
        returnValue.detail = config[0].detail;
      }
      returnValue.error_message = '';
    } catch (err) {
      logger.error(`Error in API getConfiguration: ${err}`);
      returnValue.error_message = (typeof err === 'string') ? err : err.message;
    } finally {
      await pgClient.end();
    }
  }
  console.log('returnValue = ', returnValue);
  callback(returnValue);
}

module.exports = {
  getConfiguration,
};
