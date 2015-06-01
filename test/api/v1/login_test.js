var request = require('supertest'),
  app = require('../../../app.js'),
  User = require('../../../models').User;

describe('POST /login', () => {
  let user = User.build({
    email: 'user@docker.com',
    password: 'password'
  });

  after((done) => {
    destroy(user, done);
  });

  it('registers a new user', (done) => {
    login(user)
    .expect(201, { email: user.email }, done);
  });

  context('when user already exists', () => {
    it('signs in the user', (done) => {
      login(user)
      .expect(200, { email: user.email }, done);
    });

    context('with invalid password', () => {
      it('responds with an error', (done) => {
        login({
          email: user.email,
          password: `${user.password}+`
        })
        .expect(500, {}, done);
      });
    });
  });

  context('when email is invalid', () => {

  });

  function login(user) {
    return request(app)
    .post('/api/v1/login')
    .field('email', user.email)
    .field('password', user.password);
  }

  function destroy(user, done) {
    User
    .findOne({
      where: { email: user.email }
    })
    .then(user => {
      if (!user) { return done(); }

      user
      .destroy()
      .then(() => { done() })
      .catch((err) => {
        done(err);
      });
    });
  }
});
