const db = require('./db');

const { getDBClient } = db;
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

async function addDefendant(defendant) {
  let client;
  let res;
  let defendantId = -1;
  try {
    client = getDBClient();
    await client.connect();
    const sql = `SELECT * FROM ${process.env.DB_SCHEMA}.defendants WHERE long_id = $1`;
    res = await client.query(sql, [defendant.long_id]);
    if (res.rows.length === 0) {
      res = await client.query(`
        INSERT INTO ${process.env.DB_SCHEMA}.defendants (
          long_id, first_name, middle_name, last_name, suffix, birth_date
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `,
      [
        defendant.long_id, defendant.last_name, defendant.first_name,
        defendant.middle_name, defendant.suffix, '',
      ],
      );
      if (res.rows.length > 0) {
        defendantId = res.rows[0].id;
      }
    } else {
      defendantId = res.rows[0].id;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    throw err;
  } finally {
    client.end();
  }
  return defendantId;
}

async function addCases(defendantId, casesIn) {
  let nextDate = null;
  let client;

  const cases = casesIn.map((itm) => {
    const cdate = new Date(itm.courtDate);
    if (nextDate === null || cdate < nextDate) nextDate = cdate;
    return [
      defendantId,
      itm.caseNumber,
      itm.courtDate,
      itm.court,
      itm.courtRoom,
      itm.session,
    ];
  });
  try {
    // We could compare existing cases in DB to new ones, but ... why?
    client = getDBClient();
    await client.connect();
    await client.query(
      `DELETE FROM ${process.env.DB_SCHEMA}.cases WHERE defendant_id = $1`,
      [cases[0].defendant_id],
    );
    for (let i = 0; i < cases.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await client.query(`
        INSERT INTO ${process.env.DB_SCHEMA}.cases (
          defendant_id, case_number, court_date, court, room, session
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, cases[i]);
    }
  } catch (e) {
    console.log(e);
    throw Error('Error adding or updating cases for subscription');
  } finally {
    client.end();
  }
  return nextDate;
}

async function addSubscriber(nextDate, phone, language) {
  const nextNotify = `${nextDate.getMonth() + 1}/${nextDate.getDate()}/${nextDate.getFullYear()}`;
  let client = null;
  let res;
  let subscriberId = null;
  let subscribers = null;
  try {
    client = getDBClient();
    await client.connect();
  } catch (e) {
    logger.error(`util/subscribe.addSubscriber db connect: ${e}`);
    throw Error('Error connecting to database');
  }
  try {
    res = await client.query(
      `SELECT * FROM ${process.env.DB_SCHEMA}.subscribers WHERE
       PGP_SYM_DECRYPT(encrypted_phone::bytea, $1) = $2`,
      [process.env.DB_CRYPTO_SECRET, phone],
    );
    subscribers = res.rows;
  } catch (e) {
    logger.error(`util/subscribe.addSubscriber lookup: ${e}`);
    client.end();
    throw Error('Error in subscriber lookup');
  }
  if (subscribers.length > 0) { // We already have this subscriber, update the date if needed
    subscriberId = subscribers[0].id;
    const currentNext = new Date(subscribers[0].next_notify);
    if (nextDate !== currentNext) { // Need to update the date
      try {
        client.query(
          `UPDATE ${process.env.DB_SCHEMA}.subscribers SET next_notify = $1 WHERE id = $2`,
          [nextNotify, subscriberId],
        );
      } catch (e) {
        client.end();
        throw Error('Error updating next court date');
      }
    }
  } else { // New subscriber
    try {
      res = client.query(`
        INSERT INTO ${process.env.DB_SCHEMA}.subscribers (encrypted_phone, language, next_notify, status)
        VALUES (PGP_SYM_ENCRYPT($1::text, $2), $3, $4, 'pending') RETURNING id
        `,
      [phone, process.env.DB_CRYPTO_SECRET, language, nextNotify],
      );
      const retVal = (await res).rows;
      subscriberId = retVal[0].id;
    } catch (e) {
      client.end();
      logger.error(`util/subscribe.addSubscriber add: ${e}`);
      throw Error('Error adding subscriber');
    }
  }
  client.end();
  return subscriberId;
}

async function addSubscription(subscriberId, defendantId) {
  let client;
  try {
    client = getDBClient();
    await client.connect();
    const res = await client.query(`
      SELECT * FROM ${process.env.DB_SCHEMA}.subscriptions WHERE
      subscriber_id = $1 AND defendant_id = $2
      `, [subscriberId, defendantId]);
    const retVal = res.rows;
    if (retVal.length === 0) {
      await client.query(`
        INSERT INTO ${process.env.DB_SCHEMA}.subscriptions (subscriber_id, defendant_id)
        VALUES ($1, $2)
      `, [subscriberId, defendantId]);
    }
  } catch (e) {
    throw Error('Error adding subscription');
  }
}

async function subscribe(phone, defendantLongId, details, t, language) {
  const { cases } = details;
  if (cases == null || cases.length === 0) throw t('no-cases');
  console.log('Initialize defendant');
  const defendant = initializeDefendant(defendantLongId, details);
  console.log('Add defendant');
  const defendantId = await addDefendant(defendant);
  console.log('Add cases');
  const nextDate = await addCases(defendantId, cases);
  console.log('Add subscriber');
  const subscriberId = await addSubscriber(nextDate, phone, language);
  console.log('Add subscription');
  await addSubscription(subscriberId, defendantId);
  return { defendant, subscriberId, cases };
}

module.exports = {
  subscribe,
  addCases,
};
