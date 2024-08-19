require('dotenv').config({ path: '../../.env' });
const { knex } = require('../util/db');
const { searchCourtRecords } = require('../search-court-records');
const { addCases } = require('../util/subscribe');
const { logger } = require('../util/logger');

async function updateDefendants() {
  let updatesPerCall = 5;
  const config = await knex('cn_configuration')
    .select('value').where('name', '=', 'updates_per_call');
  if (config.length > 0) {
    updatesPerCall = parseInt(config[0].value, 10);
  }
  // Get a set of defendants to update
  const defendantsToUpdate = await knex('records_to_update').select('defendant_id')
    .where('done', '=', 0).limit(updatesPerCall);
  const defendantIds = defendantsToUpdate.map((itm) => itm.defendant_id);
  logger.debug(`Defendants to update: ${JSON.stringify(defendantIds)}`);
  // Let's be optimistic and assume we'll succeed in updating, so just delete now
  await knex('records_to_update').delete().where('defendant_id', 'in', defendantIds);
  const defendants = await knex('defendants').select('*').where('id', 'in', defendantIds);

  const dt = new Date();

  for (let i = 0; i < defendants.length; i += 1) {
    const d = defendants[i];
    logger.debug(`Update defendant ${JSON.stringify(d)}`);
    // eslint-disable-next-line no-await-in-loop
    const matches = await searchCourtRecords({
      lastName: d.last_name,
      firstName: d.first_name,
      middleName: d.middle_name,
      suffix: d.suffix,
      exact: true,
    }, null);
    const match = matches.filter((itm) => (`${itm.defendant}.${itm.sex}.${itm.race}`.toLowerCase()) === d.long_id.toLowerCase());

    let updateObject;
    let nCases = 0;
    if (match.length > 0) nCases = match[0].cases.length;
    const updateLog = {
      id: d.id,
      long_id: d.long_id,
      last_valid_cases_date: d.last_valid_cases_date,
      updates: d.updates,
      original_create_date: d.created_at,
      new_case_count: nCases,
    };
    // Need to be transactionalizing all this, but for now we'll log the action before we do it.
    // eslint-disable-next-line no-await-in-loop
    await knex('log_updates').insert(updateLog);

    if (match.length > 0) {
      const { cases } = match[0];
      // eslint-disable-next-line no-await-in-loop
      await addCases(d.id, cases);
      updateObject = {
        updates: d.updates + 1,
        last_valid_cases_date: `${dt.getFullYear()}-${(dt.getMonth() + 1)}-${dt.getDate()}`,
      };
    } else {
      updateObject = {
        updates: d.updates + 1,
      };
    }
    // eslint-disable-next-line no-await-in-loop
    await knex('defendants').where('id', '=', d.id)
      .update(updateObject);
  }
}

(async () => {
  logger.debug('Call updateDefendants');
  await updateDefendants();
  logger.debug('Done with update');
  process.exit();
})();
