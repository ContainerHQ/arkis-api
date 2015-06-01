var request = require('supertest'),
  db = require('../../support/db'),
  app = require('../../../app.js');

describe('POST /login', () => {
  db.sync();

  let user = {
    email: 'user@docker.com',
    password: 'password'
  };

  it('registers a new user', (done) => {
    login(user)
    .expect(201, { email: user.email }, done);
  });

  context('when user already exists', () => {
    beforeEach((done) => {
      login(user).end(done);
    });

    it('signs in the user', (done) => {
      login(user)
      .expect(200, { email: user.email }, done);
    });

    context('with incorect password', () => {
      it('responds with an unauthorized status', (done) => {
        login({ email: user.email, password: `${user.password}+` })
        .expect(401, {}, done);
      });
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status', (done) => {
      login({ email: '', password: '' })
      .expect(400, {}, done);
    });
  });

  function login(user) {
    return request(app)
    .post('/api/v1/login')
    .field('email', user.email)
    .field('password', user.password);
  }
});
