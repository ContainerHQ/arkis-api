var db = require('../../support/db'),
 api = require('../../support/api');

describe('POST /login', () => {
  db.sync();

  let user = {
    email: 'user@docker.com',
    password: 'password'
  };

  it('registers a new user', (done) => {
    api
    .login(user)
    .expect(201, { email: user.email }, done);
  });

  context('when user already exists', () => {
    beforeEach((done) => {
      api.login(user).end(done);
    });

    it('signs in the user', (done) => {
      api
      .login(user)
      .expect(200, { email: user.email }, done);
    });

    context('with incorect password', () => {
      it('responds with an unauthorized status', (done) => {
        api
        .login({ email: user.email, password: `${user.password}+` })
        .expect(401, {}, done);
      });
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status', (done) => {
      api
      .login({ email: '', password: '' })
      .expect(400, {}, done);
    });
  });
});
