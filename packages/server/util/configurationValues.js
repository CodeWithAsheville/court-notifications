const { logger } = require('./logger');

async function getConfigurationIntValue(pgClient, name, defaultValue = 0) {
  let value = defaultValue;
  try {
    const res = await pgClient.query(`SELECT value from ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`, [name]);
    const results = res.rows;
    if (results.length > 0) value = parseInt(results[0].value, 10);
  } catch (err) {
    logger.error(`Error getting configuration value ${name}: `, err);
    throw err;
  }
  return value;
}

module.exports = {
  getConfigurationIntValue,
};
