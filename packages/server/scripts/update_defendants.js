/* eslint-disable no-await-in-loop */
require('dotenv').config({ path: '../../.env' });
const { getClient } = require('../util/db');
const { searchCourtRecords } = require('../search-court-records');
const { addCases } = require('../util/subscribe');
const { logger } = require('../util/logger');
const { getConfigurationIntValue } = require('../util/configurationValues');

async function updateDefendants() {
  let pgClient;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    logger.error('Error getting database client in update-defendants', err);
    throw err;
  }

  try {
    const schema = process.env.DB_SCHEMA;

    const updatesPerCall = await getConfigurationIntValue(pgClient, 'updates_per_call', 5);

    // Get a set of defendants to update
    const sql = `SELECT defendant_id FROM ${schema}.records_to_update WHERE done = 0 LIMIT ${updatesPerCall}`;
    let res = await pgClient.query(sql);

    if (res.rowCount > 0) {
      let currentDefendantName = '-';
      const defendantIds = res.rows.map((itm) => itm.defendant_id).join(',');
      logger.info(`Performing ${res.rowCount} updates: ${defendantIds}`);

      await pgClient.query('BEGIN');
      try {
        await pgClient.query(`DELETE FROM ${schema}.records_to_update WHERE defendant_id in (${defendantIds})`);
        res = await pgClient.query(`SELECT * from ${schema}.defendants WHERE id in (${defendantIds})`);
        const defendants = res.rows;

        const dt = new Date();
        const currentDate = `${dt.getFullYear()}-${(dt.getMonth() + 1)}-${dt.getDate()}`;

        for (let i = 0; i < defendants.length; i += 1) {
          const d = defendants[i];
          currentDefendantName = `${d.last_name}, ${d.first_name} ${d.middle_name}, ${d.suffix}`;
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

          if (match.length > 0) {
            const { cases } = match[0];
            await addCases(pgClient, d.id, cases);
            updateObject = {
              updates: d.updates + 1,
              last_valid_cases_date: currentDate,
            };
          } else {
            updateObject = {
              updates: d.updates + 1,
              last_valid_cases_date: d.last_valid_cases_date,
            };
          }

          await pgClient.query(
            `UPDATE ${schema}.defendants SET updates = $1, last_valid_cases_date = $2 WHERE id = ${d.id}`,
            [updateObject.updates, updateObject.last_valid_cases_date],
          );

          await pgClient.query(
            `INSERT INTO ${schema}.log_updates
            (id, long_id, last_valid_cases_date, updates, original_create_date, new_case_count)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [d.id, d.long_id, d.last_valid_cases_date, d.updates, d.created_at, nCases],
          );
        }
        await pgClient.query('COMMIT');
      } catch (err) {
        logger.error(`Error updating defendants (${currentDefendantName}) - rolling back: `, err);
        await pgClient.query('ROLLBACK');
        throw err;
      }
    }
  } catch (err) {
    logger.error('Error in update_defendants.js: ', err);
  } finally {
    await pgClient.end();
  }
}

(async () => {
  logger.info('Update defendant records');
  await updateDefendants();
  logger.info('Done with update');
  process.exit();
})();
