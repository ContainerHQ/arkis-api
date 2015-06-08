'use strict';

describe('PATCH /new_token', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('returns a new token', (done) => {
    api
    .newToken(user)
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

  it('revokes the previous token', () => {
    api
    .newToken(user)
    .expect(200)
    .end((err, res) => {
      if (err) { return done(err); }

      api
      .newToken(user)
      .expect(401, {}, done);
    });
  });
});
