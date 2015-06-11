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

      user.reload().then(() => {
        expect(user)
          .to.satisfy(has.validJWT).and
          .to.have.property('token')
            .that.equals(res.body.token).and
            .that.not.equals(previousToken);
        done();
      }).catch(done);
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
});
