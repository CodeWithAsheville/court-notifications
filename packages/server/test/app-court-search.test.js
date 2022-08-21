/* eslint-disable no-undef */
const supertest = require('supertest');
const app = require('../server');

const request = supertest(app);
const query = {
  language: 'en',
  firstName: '',
  lastName: 'jackson',
  middleName: '',
  cases: [],
  selectedDefendant: null,
  selectedCase: null,
  phone_number: '',
  phone_message: '',
  signupSuccess: false,
  searchError: false,
  searchErrorMessage: false,
  searchSubmitted: false,
  searchInProgress: false,
  searchReturned: false,
};

it('Gets the court-search endpoint', async () => {
  // Sends POST Request to /court-search endpoint
  const res = await request
    .post('/api/court-search')
    .send(query)
    .set('Accept', 'application/json');
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.status).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(1);
  const expected = [
    expect.stringMatching(/^JACKSON/),
  ];
  for (let i = 0; i < res.body.length; i += 1) {
    const itm = res.body[i];
    expect([itm.defendant]).toEqual(expect.arrayContaining(expected));
    expect(itm.cases.length).toBeGreaterThan(0);
  }
});
