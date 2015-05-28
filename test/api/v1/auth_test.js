var request = require('supertest'),
  app = require('../../../app.js');

const LOGIN   = '/api/v1/login',
      SIGN_UP = '/api/v1/signup';

describe(`POST ${SIGN_UP}`, () => {
  it('responds with status 200', (done) => {
    request(app)
    .post(SIGN_UP)
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200, { name: 'mof le moche' }, done);
  });
});
