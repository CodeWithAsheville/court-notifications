/* eslint-disable no-undef */
const supertest = require('supertest');
const app = require('../server');

const request = supertest(app);
const { knex } = require('../util/db');

const query = {
  selectedDefendant: 'JACKSON,BRIAN,KEITH.11/04',
  agency: 'AHOPE',
  details: {
    defendant: 'JACKSON,BRIAN,KEITH',
    dob: '11/04',
    cases: [
      {
        court: 'District',
        courtDate: '02/16/2022',
        courtRoom: '002B',
        session: 'AM',
        caseNumber: '20CR080142',
        linkToCaseDetails: 'http://www1.aoc.state.nc.us/www/calendars.Offense.do?submit=submit&case=1002020080142&court=CR',
        citationNumber: 'Y0048344',
      },
      {
        court: 'District',
        courtDate: '02/16/2022',
        courtRoom: '002B',
        session: 'AM',
        caseNumber: '20CR080143',
        linkToCaseDetails: 'http://www1.aoc.state.nc.us/www/calendars.Offense.do?submit=submit&case=1002020080143&court=CR',
        citationNumber: 'Y0048343',
      },
    ],
    completed: false,
  },
};

jest.mock('../util/twilio-client', () => {
  // eslint-disable-next-line no-unused-vars
  const fct = async (obj) => {
    const msg = 'You have subscribed to notifications for BRIAN KEITH JACKSON . You may find details of charges on the NC Judicial Branch site: https://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&defendant=JACKSON,BRIAN,KEITH&start=0&navindex=0&fromcrimquery=yes&submit=Search';
    return Promise.resolve({ body: msg });
  };
  return {
    twilioClient: {
      messages: {
        create: fct,
      },
    },
  };
});

it('Successfully subscribes to a defendant', async () => {
  // Sends POST Request to /court-search endpoint
  const res = await request
    .post('/api/subscribe-to-defendant')
    .send(query)
    .set('Accept', 'application/json');
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.status).toEqual(200);
  expect(res.body.code).toEqual(200);
  expect(res.body.message).toEqual('Successfully subscribed');
  expect(res.body.index).toBeGreaterThan(0);
  const subscribers = await knex('subscribers').select().where({
    id: res.body.index,
  });
  expect(subscribers.length).toEqual(1);
});
