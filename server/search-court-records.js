const https = require("https");
const { JSDOM } = require("jsdom");
const { CourtCase } = require("./court-case")
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

function createCaseFromHtml(tr) {
  const mapped = [];

  for (let i = 0; i < tr.children.length; i++) {
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
  let queryParams = `defendant=${state.lastName}`

  if (state.firstName) queryParams += `%2C${state.firstName}`

  if (state.middleName) queryParams += `%2C${state.middleName}`

  return `https://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&${queryParams}&start=${start}&navindex=${navIndex}&fromcrimquery=yes&submit=${submit}`;
}

async function getCasesPage(axiosInstance, url, cases, onError) {
  let resp = await axiosInstance.get(url, {withCredentials: true});
  let content = resp.data;

  const dom = new JSDOM(content);
  const table = dom.window.document.querySelector(".criminalquery-table");

  if (table) {
    const rows = table.querySelectorAll("tbody > tr");
    if (rows.length > 0) {
      rows.forEach((row) => {
        cases.push(createCaseFromHtml(row))
      });
    }
  }

  let nextPage = {
    keepOn: false,
    start: 0,
    navindex: 0,
    submit: 'Search'
  };

  // Check to see if there are more pages of results
  const forms = dom.window.document.querySelectorAll("form")
  if (forms) {
    forms.forEach((searchagain) => {
      if (!nextPage.keepOn) { // Skip if we already found it
        const inputs = searchagain.querySelectorAll("input")
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
  return nextPage
}

async function searchCourtRecords(body, callback, onError) {  
  const axiosInstance = axios.create();
  axiosCookieJarSupport(axiosInstance);
  axiosInstance.defaults.jar = new tough.CookieJar(); // Make sure we're using cookies

  let url = computeSearchUrl(body, 0, 0, 'Search');
  const cases = []

  let nextPage = await getCasesPage(axiosInstance, url, cases, onError, false)

  let keepOn = nextPage.keepOn;
  let count = 0;
  while (keepOn) {
    url = computeSearchUrl(body, nextPage.start, nextPage.navindex, nextPage.submit);
    nextPage = await getCasesPage(axiosInstance, url, cases, onError)
    keepOn = nextPage.keepOn;
    count = count + 1;
    if (count > 3) keepOn = false;
  }
  callback(cases);
}

module.exports = {
  searchCourtRecords
}