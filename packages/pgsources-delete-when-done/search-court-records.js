console.log('s1');
const { dbClient } = require('./util/db');
console.log('s2');
console.log(dbClient);

function sortByDefendant(a, b) {
  if (a.defendant < b.defendant) {
    return -1;
  }
  if (a.defendant < b.defendant) {
    return 1;
  }
  return 0;
}

async function doSearch(body) {
  console.log('s3');
  let queryWhere = `${body.lastName}`;
  if (body.exact) {
    if (body.firstName) queryWhere += `,${body.firstName}`;
    if (body.middleName) queryWhere += `,${body.middleName}`;
    if (body.suffix) queryWhere += `,${body.suffix}`;
  } else {
    queryWhere += '%';
    if (body.firstName) {
      if (body.firstName) queryWhere += `,${body.firstName}%`;
      if (body.middleName) queryWhere += `,${body.middleName}%`;
    }
  }
  console.log('s4');

  let courtDateList = [];
  try {
    const client = dbClient({
      host: process.env.CD_DB_HOST,
      port: 5432,
      user: process.env.CD_DB_USER,
      password: process.env.CD_DB_PASSWORD,
      database: process.env.CD_DB_NAME,
      max: 10,
      idleTimeoutMillis: 10000,
    });
//    await client.connect();
    const query = 'SELECT * FROM cn.criminal_dates where LOWER(defendant_name) LIKE $1';
    const res = await client.query(query, [queryWhere.toLowerCase()]);
    courtDateList = res.rows;
    await client.end();
    // courtDateList = await knex('criminal_dates').withSchema('cn').select('*')
    //   .whereRaw('LOWER(defendant_name) LIKE ?', queryWhere.toLowerCase());
  } catch (e) {
    console.log('Got an error trying to read court dates ', e);
  }

  const defendants = {};
  courtDateList.forEach((item) => {
    const race = (item.defendant_race && item.defendant_race.length > 0) ? item.defendant_race : '-';
    const sex = (item.defendant_sex && item.defendant_sex.length > 0) ? item.defendant_sex : '-';
    const defendantID = `${item.defendant_name}.${sex}.${race}`;
    if (!(defendantID in defendants)) {
      defendants[defendantID] = [];
    }
    defendants[defendantID].push(item);
  });

  const cases = [];
  const keys = Object.keys(defendants);
  keys.forEach((item) => {
    const caselist = defendants[item];
    const first = caselist[0];
    const race = (first.defendant_race && first.defendant_race.length > 0) ? first.defendant_race : '-';
    const sex = (first.defendant_sex && first.defendant_sex.length > 0) ? first.defendant_sex : '-';
    const d = {
      defendant: first.defendant_name,
      dob: '',
      race,
      sex,
      cases: caselist.map((c) => {
        const dt = c.calendar_date;
        const x = {
          court: (c.court_type === 'S') ? 'Superior' : 'District',
          courtDate: `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`,
          courtRoom: c.courtroom ? c.courtroom : '',
          session: c.calendar_session,
          caseNumber: c.case_number,
          linkToCaseDetails: '',
          citationNumber: c.citation_number,
        };
        return x;
      }),
    };
    cases.push(d);
  });

  return cases.sort(sortByDefendant);
}

async function searchCourtRecords(body, callback) {
  const cases = await doSearch(body);
  if (callback !== null) {
    callback(cases);
  }
  return cases;
}

module.exports = {
  searchCourtRecords,
};
