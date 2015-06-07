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

  context('with forbidden attributes', () => {
    let attributes = ['provider', 'provider_id'];

    it('these attributes are filtered', (done) => {
      let login = api.login(user);

      attributes.forEach(attribute => {
        login = login.field(attribute, '*');
      });

      login
      .expect(200)
      .end((err, res) => {
        User.findOne({ where: user })
        .then(user => {
          attributes.forEach(attribute => {
            expect(user[attribute]).not.to.exist;
          });
          done();
        }).catch(done);
      });
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status', (done) => {
      api
      .login()
      .expect(400)
      .end((err, res) => {
        expect(User.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });
});
