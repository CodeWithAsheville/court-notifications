const knexConfig = require('../knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(knexConfig);

module.exports = {
  knex,
};
