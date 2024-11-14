require('dotenv').config({ path: '../../.env' });
const { getClient } = require('../util/db');
const { searchCourtRecords } = require('../search-court-records');
const { addCases } = require('../util/subscribe');
const { logger } = require('../util/logger');

async function getConfigurationIntValue(pgClient, name, defaultValue = 0) {
  let value = defaultValue;
  try {
    const res = await pgClient.query(`SELECT value from ${process.env.DB_SCHEMA}.cn_configuration WHERE name = $1`, [name]);
    const results = res.rows;
    if (results.length > 0) value = parseInt(results[0].value, 10);
    console.log(`Got the configuration value ${name}: ${value}`);
  } catch (err) {
    logger.error(`Error getting configuration value ${name} client in purge-and-update-subscriptions`, err);
    throw err;
  }
  return value;
}

async function updateDefendants() {
  let pgClient;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    logger.error('Error getting database client in purge-and-update-subscriptions', err);
    throw err;
  }

  try {
    const schema = process.env.DB_SCHEMA;

    const updatesPerCall = await getConfigurationIntValue(pgClient, 'updates_per_call', 5);

    // Get a set of defendants to update
    let sql = `SELECT defendant_id FROM ${schema}.records_to_update WHERE done = 0 LIMIT ${updatesPerCall}`;
    let res = await pgClient.query(sql);

    console.log('Updates to perform: ', res.rowCount);
    if (res.rowCount > 0) {
      const defendantIds = res.rows.map((itm) => itm.defendant_id).join(',');
      logger.debug(`Defendants to update: ${JSON.stringify(defendantIds)}`);

      // Let's be optimistic and assume we'll succeed in updating, so just delete now
      sql = `DELETE FROM ${schema}.records_to_update WHERE defendant_id in (${defendantIds})`;
      console.log('Here is the SQL to delete from records_to_update: ', sql);
      await pgClient.query(sql);
      sql = `SELECT * from ${schema}.defendants WHERE id in (${defendantIds})`;
      console.log('Here is the SQL to get defendant records: ', sql);
      res = await pgClient.query(sql);
      const defendants = res.rows;

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

        // Need to be transactionalizing all this, but for now we'll log the action before we do it.
        // eslint-disable-next-line no-await-in-loop
        await pgClient.query(
          `INSERT INTO ${schema}.log_updates
          (id, long_id, last_valid_cases_date, updates, original_create_date, new_case_count)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [d.id, d.long_id, d.last_valid_cases_date, d.updates, d.created_at, nCases],
        );

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

        sql = `UPDATE ${schema}.defendants SET updates = $1, last_valid_cases_date = $2 WHERE id = ${d.id}`;
        console.log('Now do the update: ', sql);
        // eslint-disable-next-line no-await-in-loop
        await pgClient.query(sql, [updateObject.updates, updateObject.last_valid_cases_date]);
      }
    }
  } catch (err) {
    console.log('Error in update_defendants.js: ', err);
  } finally {
    await pgClient.end();
  }
}

(async () => {
  logger.debug('Call updateDefendants');
  await updateDefendants();
  logger.debug('Done with update');
  process.exit();
})();
