'use strict';

describe('GET /account/profile', () => {
  db.sync();
  db.create(['user']);

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('returns the user profile', done => {
    api.account(user).getProfile()
    .expect(200, (err, res) => {
      if (err) { return done(err); }

      let profile = format.response(res.body.profile);

      user.getProfile().then(userProfile => {
        expect(profile).to.deep.equal(format.serialize(userProfile));
        done();
      }).catch(done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().getProfile().expect(401, done);
    });
  });
});
