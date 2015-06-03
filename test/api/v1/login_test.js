'use strict';

describe('POST /login', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
  });

  it('registers a new user', (done) => {
    api
    .login(user)
    .expect(201)
    .expect(has.validJWT)
    .end(done);
  });

  context('when user already exists', () => {
    beforeEach((done) => {
      factory.create('user', done);
    });

    it('signs in the user', (done) => {
      api
      .login(user)
      .expect(200)
      .expect(has.validJWT)
      .end(done);
    });

    context('with incorrect password', () => {
      beforeEach(() => {
        user.password += '*';
      });

      it('responds with an unauthorized status', (done) => {
        api
        .login(user)
        .expect(401, {}, done);
      });
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status', (done) => {
      api
      .login()
      .expect(400, {}, done);
    });
  });
});
