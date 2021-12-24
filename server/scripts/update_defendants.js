require('dotenv').config({ path: '../../.env' })
var env         = 'development';
const { knex } = require('../util/db');
const { searchCourtRecords } = require('../search-court-records');
const { addCases } = require('../util/subscribe');
const { logger } = require('../util/logger');

async function updateDefendants(purgeDate, updateDays) {

  let updatesPerCall = 5
  const config = await knex('cn_configuration')
    .select('value').where('name', '=', 'updates_per_call');
  if (config.length > 0) {
    updatesPerCall = parseInt(config[0].value)
  }
  // Get a set of defendants to update
  const defendantsToUpdate = await knex('records_to_update').select('defendant_id')
    .where('done', '=', 0).limit(updatesPerCall);
  const defendantIds = defendantsToUpdate.map(itm => itm.defendant_id)
  logger.debug('Defendants to update: ', JSON.stringify(defendantIds));
  // Let's be optimistic and assume we'll succeed in updating, so just delete now
  await knex('records_to_update').delete().where('defendant_id', 'in', defendantIds);
  const defendants = await knex('defendants').select('*').where('id', 'in', defendantIds);
  for (let i = 0; i<defendants.length; ++i) {
    const d = defendants[i];
    logger.debug('Update defendant ', JSON.stringify(d));
    const matches = await searchCourtRecords({lastName: d.last_name, firstName: d.first_name, middleName: d.middle_name}, null);
    let match = matches.filter(itm => (itm.defendant + '.' + itm.dob) === d.long_id);
    if (match.length > 0) {
      const cases = match[0].cases
      await addCases(d.id, cases);
    }
    let updates = d.updates + 1;
    await knex('defendants').where('id', '=', d.id)
      .update({ updates });
  }
}

// Purge all court cases in the past and everything that 
// depends only on them. Then set up a list of defendants 
// due to be updated. Actual updates happen in a separate
// script
(async() => {
  logger.debug('Call updateDefendants');
  await updateDefendants('2021-08-09', -1);
  logger.debug('Done with update');
  process.exit();
})();
