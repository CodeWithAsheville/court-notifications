const { JSDOM } = require('jsdom');
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const { CourtCase } = require('./court-case');

const maxPages = 50;

function createCaseFromHtml(tr) {
  const mapped = [];

  for (let i = 0; i < tr.children.length; i += 1) {
    const td = tr.children[i];
    const text = td.textContent.trim();

    if (i === 6) {
      mapped.push([text, td.children[0].href]);
    } else {
      mapped.push(text);
    }
  }

  return CourtCase(mapped);
}

function computeSearchUrl(state, start, navIndex, submit) {
  let queryParams = `defendant=${state.lastName}`;

  if (state.firstName) queryParams += `%2C${state.firstName}`;

  if (state.middleName) queryParams += `%2C${state.middleName}`;

  return `https://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&${queryParams}&start=${start}&navindex=${navIndex}&fromcrimquery=yes&submit=${submit}`;
}

async function getCasesPage(axiosInstance, url, cases) {
  const resp = await axiosInstance.get(url, { withCredentials: true });
  const content = resp.data;

  const dom = new JSDOM(content);
  const table = dom.window.document.querySelector('.criminalquery-table');

  if (table) {
    const rows = table.querySelectorAll('tbody > tr');
    if (rows.length > 0) {
      rows.forEach((row) => {
        cases.push(createCaseFromHtml(row));
      });
    }
  }

  const nextPage = {
    keepOn: false,
    start: 0,
    navindex: 0,
    submit: 'Search',
  };

  // Check to see if there are more pages of results
  const forms = dom.window.document.querySelectorAll('form');
  if (forms) {
    forms.forEach((searchagain) => {
      if (!nextPage.keepOn) { // Skip if we already found it
        const inputs = searchagain.querySelectorAll('input');
        const formValues = {};
        inputs.forEach((ip) => {
          if (ip.getAttribute('TYPE') === 'HIDDEN') {
            formValues[ip.getAttribute('NAME')] = ip.getAttribute('VALUE');
          }
        });
        if (formValues.submit === 'Next 25') {
          nextPage.keepOn = true;
          nextPage.start = formValues.start;
          nextPage.navindex = formValues.navindex;
          nextPage.submit = 'Next+25';
        }
      }
    });
  }
  return nextPage;
}

function sortByDefendant(a, b) {
  if (a.defendant < b.defendant) {
    return -1;
  }
  if (a.defendant < b.defendant) {
    return 1;
  }
  return 0;
}

async function searchCourtRecords(body, callback) {
  const axiosInstance = axios.create();
  axiosCookieJarSupport(axiosInstance);
  axiosInstance.defaults.jar = new tough.CookieJar(); // Make sure we're using cookies

  let url = computeSearchUrl(body, 0, 0, 'Search');
  let cases = [];

  let nextPage = await getCasesPage(axiosInstance, url, cases, false);

  let { keepOn } = nextPage;
  let count = 0;
  while (keepOn) {
    url = computeSearchUrl(body, nextPage.start, nextPage.navindex, nextPage.submit);
    // eslint-disable-next-line no-await-in-loop
    nextPage = await getCasesPage(axiosInstance, url, cases);
    keepOn = nextPage.keepOn;
    count += 1;
    if (count > maxPages) keepOn = false;
  }
  const defendants = {};
  cases.forEach((item) => {
    const defendantID = `${item.defendant}.${item.dob}`;
    if (!(defendantID in defendants)) {
      defendants[defendantID] = [];
    }
    defendants[defendantID].push(item);
  });

  cases = [];
  const keys = Object.keys(defendants);
  keys.forEach((item) => {
    const caselist = defendants[item];
    const first = caselist[0];
    const d = {
      defendant: first.defendant,
      dob: first.dob,
      cases: caselist.map((c) => {
        const detailsUrl = new URL(c.linkToCaseDetails);
        detailsUrl.searchParams.delete('prev');
        return {
          court: c.court,
          courtDate: c.courtDate,
          courtRoom: c.courtRoom,
          session: c.session,
          caseNumber: c.caseNumber,
          linkToCaseDetails: detailsUrl.toString(),
          citationNumber: c.citationNumber,
        };
      }),
    };
    cases.push(d);
  });
  cases = cases.sort(sortByDefendant);
  if (callback !== null) {
    callback(cases);
  }
  return cases;
}

module.exports = {
  searchCourtRecords,
};
