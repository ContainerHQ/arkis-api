'use strict';

let _ = require('lodash'),
  User = require('../../../app/models').User;

describe('POST /auth/login', () => {
  db.sync();

  let user;

  /*
   * We need a non save user in order to login
   * with the original password (before hashing).
   */
  beforeEach(() => {
    user = factory.buildSync('user');
  });

  it('registers a new user and returns its token', done => {
    api.auth.login(user).expect(201, (err, res) => {
      if (err) { return done(err); }
      /*
       * Retrieve the newly created user and verify the token.
       */
      expect(User.findOne({ where: { email: user.email } }))
        .to.eventually.exist.and.have.property('token', res.body.token)
        .notify(done);
    });
  });

  context('when user already exists', () => {
    beforeEach(() => {
      return user.save();
    });

    it('returns the user token', done => {
      let userToken = user.token;

      api.auth.login(user).expect(200, { token: userToken }, done);
    });

    context('with incorrect password', () => {
      beforeEach(() => {
        user.password += '*';
      });

      it('responds with an unauthorized status', done => {
        api.auth.login(user).expect(401, done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let attributes;

    beforeEach(() => {
      attributes = _.difference(user.attributes,
        ['id', 'email', 'password', 'password_hash', 'token', 'token_id']
      );
      user = factory.buildSync('forbiddenUser');
    });

    it('these attributes are filtered', done => {
      api.auth.login(user).send(user).expect(201, (err, res) => {
        if (err) { return done(err); }

        expect(User.findOne({ where: { email: user.email } }))
          .to.eventually.satisfy(has.beenFiltered(user, attributes))
          .notify(done);
      });
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status and errors', done => {
      api.auth.login().expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(User.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });
});
