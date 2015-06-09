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
    user = factory.buildSync('user', { jit: null });
  });

  it('registers a new user and returns its token', (done) => {
    api
    .login(user)
    .expect(201)
    .end((err, res) => {
      if (err) { return done(err); }
      /*
       * Retrieve the newly created user.
       *
       */
      expect(User.findOne({ where: user }))
        .to.eventually.have.property('token', res.body.token)
        .notify(done);
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

  context('with forbidden attributes', () => {
    let attributes;

    beforeEach(() => {
      attributes = _.difference(user.attributes, ['email', 'password']);
    });

    it('these attributes are filtered', (done) => {
      addAttributesTo(api.login(user), attributes)
      .expect(201)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(User.findOne({ where: user }))
          .to.eventually.satisfy(has.beenFiltered(attributes))
          .notify(done);
      });
    });
  });

  function addAttributesTo(action, attributes) {
    attributes.forEach(attribute => {
      action = action.field(attribute, '*');
    });
    return action;
  }

  context('with invalid attributes', () => {
    it('responds with a bad request status and errors', (done) => {
      api
      .login()
      .expect(400)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(User.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });
});
