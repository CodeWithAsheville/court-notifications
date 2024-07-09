const { knex } = require('./util/db');

async function getConfiguration (query, callback) {
  const returnValue = {
    name: query.name,
    type: null,
    value: null,
    detail: null,
    error_message: 'Configuration value not found',
  };
  if (query.name) {
    try {
      const config = await knex('cn_configuration').select().where({
        name: query.name,
      });
      if (config.length > 0) {
        returnValue.type = config[0].type;
        returnValue.value = config[0].value;
        returnValue.detail = config[0].detail;
      }
      returnValue.error_message = '';
    } catch (e) {
      returnValue.error_message = (typeof e === 'string') ? e : e.message;
    }
  }
  callback(returnValue);
}

module.exports = {
  getConfiguration,
};
