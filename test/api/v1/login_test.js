'use strict';

var User = require('../../../app/models').User;

describe('POST /login', () => {
  db.sync();

  let user;

  /*
   * We need a non save user in order to login
   * with the original password (before hashing).
   *
   */
  beforeEach(() => {
    user = factory.buildSync('user');
  });

  it('registers a new user and returns its token', (done) => {
    api
    .login(user)
    .expect(201)
    .end((err, res) => {
      if (err) { done(err); }
      /*
       * Retrieve the newly created user.
       *
       */
      User.findOne({ where: user })
      .then(user => {
        expect(res.body.token).to.equal(user.token);
        done();
      }).catch(done);
    });
  });

  context('when user already exists', () => {
    let userToken;

    beforeEach((done) => {
      factory.create('user', (err, user) => {
        userToken = user.token;
        done(err);
      });
    });

    it('returns the user token', (done) => {
      api
      .login(user)
      .expect(200, { token: userToken }, done);
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
      .expect(400)
      .end((err, res) => {
        expect(res.body.errors).to.exist;
        done();
      });
    });
  });
});
