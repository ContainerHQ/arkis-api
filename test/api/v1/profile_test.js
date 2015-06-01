var db = require('../../support/db'),
  api = require('../../support/api');

db.sync();

let getUser = db.createUser({
  email: 'harry@hogwarts.com',
  password: '<3mAgic'
});

describe('GET /profile', () => {
  it('returns the user profile', (done) => {
    api
    .profile(getUser())
    .expect(200)
    .end(done);
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', (done) => {
      api
      .profile(getUser(), 'invalidToken')
      .expect(401, {}, done);
    });
  });
});

describe('POST /profile', () => {
  it('updates the user profile', () => {

  });
});
