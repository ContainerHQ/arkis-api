'use strict';

describe('GET /account/new_token', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('returns a new token', done => {
    api.account(user).generateNewToken()
    .expect(200)
    .end((err, res) => {
      if (err) { return done(err); }

      let previousToken = user.token;

      expect(user.reload())
        .to.eventually.satisfy(has.validJWT).and
        .to.eventually.have.property('token')
          .that.equals(res.body.token).and
          .that.not.equals(previousToken)
        .notify(done);
      });
  });

  it('revokes the previous token', done => {
    api.account(user).generateNewToken()
    .expect(200)
    .end((err, res) => {
      if (err) { return done(err); }

      api.account(user).generateNewToken()
      .expect(401, {}, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().generateNewToken()
      .expect(401, {}, done);
    });
  });
});
