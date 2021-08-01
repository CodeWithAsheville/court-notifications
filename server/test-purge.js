const {test} = require('./purge-subscriptions');

(async() => {
  console.log('Call purge-subscriptions');
  await test('2021-08-09', -1);
  console.log('Done with purge');
  process.exit();
})();







