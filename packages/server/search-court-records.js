const knexConfig = require('./cd_knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(knexConfig);

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
  let queryWhere = `${body.lastName}`;
  if (body.exact) {
    if (body.firstName) queryWhere += `,${body.firstName}`;
    if (body.middleName) queryWhere += `,${body.middleName}`;
  } else {
    queryWhere += '%';
    if (body.firstName) {
      if (body.firstName) queryWhere += `,${body.firstName}%`;
      if (body.middleName) queryWhere += `,${body.middleName}%`;
    }
  }

  let courtDateList = [];
  try {
    courtDateList = await knex('criminal_dates').select('*')
      .whereRaw('LOWER(defendant_name) LIKE ?', queryWhere.toLowerCase());
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
