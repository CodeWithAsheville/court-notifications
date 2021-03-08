const http = require("http");
const { JSDOM } = require("jsdom");
const { CourtCase } = require("./court-case")

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

function computeSearchUrl(state) {
  let queryParams = `defendant=${state.lastName}`

  if (state.firstName) queryParams += `%2C${state.firstName}`

  if (state.middleName) queryParams += `%2C${state.middleName}`

  return `http://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&${queryParams}&start=0&navindex=0&fromcrimquery=yes&submit=Search`;
}

function searchCourtRecords(body, callback, onError) {
  const url = computeSearchUrl(body)

  http
    .get(url, function (res) {
      let content = "";

      res.on("data", function (chunk) {
        content += chunk;
      });

      res.on("end", function () {
        const dom = new JSDOM(content);

        const table = dom.window.document.querySelector(".criminalquery-table");
        const cases = []

        if (table) {
          const rows = table.querySelectorAll("tbody > tr");
          if (rows.length > 0) {
            rows.forEach((row) => {
              cases.push(createCaseFromHtml(row))
            });
          }
        }
        
        callback(cases)
      });
    })
    .on("error", onError);
}

module.exports = {
  searchCourtRecords
}