const {test} = require('./purge-and-update-subscriptions');

(async() => {
  console.log('Call purge-and-update-subscriptions');
  await test('2021-08-09', -1);
  console.log('Done with purge');
  process.exit();
})();







