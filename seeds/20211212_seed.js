require('dotenv').config()
const { subscribe } = require('../server/util/subscribe');
const testData = require('./testdata.json');

if (!process.env.TEST_PHONE_NUMBER) {
  throw new Error('You must set the TEST_PHONE_NUMBER environment variable to an SMS-capable phone.')
}

exports.seed = async function(knex) {
  // Clear out all the tables
  await knex('cases').del();
  await knex('subscriptions').del();
  await knex('subscribers').del();
  await knex('defendants').del();
  const today = new Date();
  const courtDates = [new Date(), new Date(), new Date()];
  courtDates[0].setDate(today.getDate() + 2);
  courtDates[1].setDate(today.getDate() + 7);
  courtDates[2].setDate(today.getDate() - 3);
  let failed = null;
  for (let i = 0; i<testData.subscriptions.length; ++i) {
    let itm = testData.subscriptions[i];
    let d = courtDates[i%3];
    for (let j=0; j<itm.details.cases.length; ++j) {
      itm.details.cases[j].courtDate = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear();
    }
    let phone = process.env.TEST_PHONE_NUMBER;
    if (i === testData.subscriptions.length-1) phone = '8285551212'
    const result = await subscribe(phone, itm.selectedDefendant, itm.details);
    failed = result.subscriberId;
    console.log('Seeded data:');
    console.log(JSON.stringify(result));
  }

  await knex('subscribers').update('status', 'confirmed');
  await knex('subscribers').update({status: 'failed', failed: 1}).where('id', failed);
};
