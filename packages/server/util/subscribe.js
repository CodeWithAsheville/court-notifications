const { getClient } = require('./db');
const { logger } = require('./logger');

function initializeDefendant(longDefendantId, details) {
  const dt = new Date();
  const defendant = {
    long_id: longDefendantId,
    last_name: '',
    first_name: '',
    middle_name: null,
    suffix: null,
    birth_date: '',
    sex: details.sex,
    race: details.race,
    last_valid_cases_date: `${dt.getFullYear()}-${(dt.getMonth() + 1)}-${dt.getDate()}`,
  };
  defendant.birth_date = details.dob;
  let d = [];
  d = details.defendant.split(',');
  // TODO Could be lname,fname,suffix
  [defendant.last_name, defendant.first_name = '', defendant.middle_name = '', defendant.suffix = ''] = d;
  // defendant.last_name = d[0];
  // if (d.length >= 2) {
  //   defendant.first_name = d[1];
  //   if (d.length >= 3) { //TODO Could be lname,fname,suffix
  //     defendant.middle_name = d[2];
  //     if (d.length >= 4) {
  //       defendant.suffix = d[3];
  //     }
  //   }
  // }
  return defendant;
}

async function addDefendant(pgClient, defendant) {
  const schema = process.env.DB_SCHEMA;
  console.log('In addDefendant')
  let res = await pgClient.query(
    `SELECT id FROM ${schema}.defendants WHERE long_id = $1`,
    [defendant.long_id],
  );
  if (res.rowCount !== 0) {
    console.log('Defendant already exists');
    return res.rows[0].id;
  }

  // Need to insert
  res = await pgClient.query(
    `INSERT INTO ${schema}.defendants (
      long_id, last_name, first_name, middle_name, suffix, birth_date, sex, race, last_valid_cases_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      defendant.long_id,
      defendant.last_name,
      defendant.first_name,
      defendant.middle_name,
      defendant.suffix,
      defendant.birth_date,
      defendant.sex,
      defendant.race,
      defendant.last_valid_cases_date,
    ],
  );

  if (res.rowCount > 0) {
    console.log('Successfully added defendant: ', res.rows[0]);
    return res.rows[0].id;
  }
  throw new Error('Error inserting defendant - no rows returned');
}

async function addCases(pgClient, defendantId, casesIn) {
  const schema = process.env.DB_SCHEMA;
  let nextDate = null;

  // We could compare existing cases in DB to new ones, but ... why?
  await pgClient.query(`DELETE FROM ${schema}.cases WHERE defendant_id = $1`, [defendantId]);

  // Now insert the new cases
  for (let i = 0; i < casesIn.length; i += 1) {
    const itm = casesIn[i];
    const cdate = new Date(itm.courtDate);
    if (nextDate === null || cdate < nextDate) nextDate = cdate;
    // eslint-disable-next-line no-await-in-loop
    await pgClient.query(
      `INSERT INTO ${schema}.cases
        (defendant_id, case_number, court_date, court, room, session)
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        defendantId,
        itm.caseNumber,
        itm.courtDate,
        itm.court,
        itm.courtRoom,
        itm.session,
      ],
    );
  }
  return nextDate;
}

async function addSubscriber(pgClient, nextDate, phone, language) {
  const schema = process.env.DB_SCHEMA;
  const nextNotify = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`;
  let subscriberId = null;
  let subscribers = null;
  let res;

  try {
    res = await pgClient.query(
      `SELECT * FROM ${schema}.subscribers WHERE PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) = $2`,
      [process.env.DB_CRYPTO_SECRET, phone],
    );

    subscribers = res.rows;
  } catch (e) {
    logger.error(`util/subscribe.addSubscriber lookup: ${e}`);
    throw Error('Error in subscriber lookup');
  }
  if (subscribers.length > 0) { // We already have this subscriber, update the date if needed
    subscriberId = subscribers[0].id;
    const currentNext = new Date(subscribers[0].next_notify);
    if (nextDate !== currentNext) { // Need to update the date
      try {
        await pgClient.query(
          `UPDATE ${schema}.subscribers SET next_notify = $1 WHERE id = $2`,
          [nextNotify, subscriberId],
        );
      } catch (e) {
        throw Error('Error updating next court date');
      }
    }
  } else { // New subscriber
    try {
      res = await pgClient.query(
        `
        INSERT INTO ${schema}.subscribers
          (encrypted_phone, language next_notify, status)
          VALUES (PGP_SYM_ENCRYPT($1::text, $2), $3, $4, 'pending')
          RETURNING id`,
        [
          phone,
          process.env.DB_CRYPTO_SECRET,
          language,
          nextNotify,
        ],
      );
      subscriberId = res.rows[0].id;
    } catch (e) {
      logger.error(`util/subscribe.addSubscriber add: ${e}`);
      throw Error('Error adding subscriber');
    }
  }
  return subscriberId;
}

async function addSubscription(pgClient, subscriberId, defendantId) {
  const schema = process.env.DB_SCHEMA;
  const res = await pgClient.query(
    `SELECT * FROM ${schema}.subscriptions WHERE subscriber_id = $1 AND defendant_id = $2`,
    [subscriberId, defendantId],
  );
  if (res.rowCount === 0) {
    await pgClient.query(
      `INSERT INTO ${schema}.subscriptions (subscriber_id, defendant_id) VALUES ($1, $2)`,
      [subscriberId, defendantId],
    );
  }
}

async function subscribe(phone, defendantLongId, details, t, language) {
  const { cases } = details;
  if (cases == null || cases.length === 0) throw t('no-cases');

  let pgClient;
  try {
    pgClient = getClient();
    await pgClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    logger.error('Error getting database client in purge-and-update-subscriptions', err);
    throw err;
  }
  let defendant;
  let subscriberId;
  let saveError = null;
  try {
    defendant = initializeDefendant(defendantLongId, details);
    const defendantId = await addDefendant(pgClient, defendant);
    const nextDate = await addCases(pgClient, defendantId, cases);
    subscriberId = await addSubscriber(pgClient, nextDate, phone, language);
    await addSubscription(pgClient, subscriberId, defendantId);
  } catch (err) {
    console.log('Error in subscribe.js: ', err);
    saveError = `Error in subscribe.js: ${err}`;
  } finally {
    await pgClient.end();
  }
  if (saveError) throw saveError;

  return { defendant, subscriberId, cases };
}


module.exports = {
  subscribe,
  addCases,
};
