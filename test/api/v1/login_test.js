var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets'),
  db = require('../../support/db'),
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
    .expect(201)
    .expect(validJsonWebToken)
    .end(done);
  });

  context('when user already exists', () => {
    beforeEach((done) => {
      api.login(user).end(done);
    });

    it('signs in the user', (done) => {
      api
      .login(user)
      .expect(200)
      .expect(validJsonWebToken)
      .end(done);
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

  function validJsonWebToken(res) {
    let token = res.body.token;

    return jwt.verify(token, secrets.jwt);
  }
});
