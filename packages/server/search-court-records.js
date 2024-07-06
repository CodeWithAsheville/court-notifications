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
  if (body.firstName) {
    if (body.firstName) queryWhere += `%2C${body.firstName}`;
    if (body.middleName) queryWhere += `%2C${body.middleName}`;
  } else {
    queryWhere += '%';
  }

  const courtDateList = await knex('criminal_dates').select('*')
    .whereRaw('LOWER(defendant_name) LIKE ?', queryWhere.toLowerCase());

  const defendants = {};
  courtDateList.forEach((item) => {
    const defendantID = `${item.defendant_name}`;
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
    const d = {
      defendant: first.defendant_name,
      dob: '',
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
