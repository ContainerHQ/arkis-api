'use strict';

describe('/profile', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  describe('GET', () => {
    it('returns the user profile', (done) => {
      api
      .profile(user)
      .expect(200)
      .end((err, res) => {
        user.getProfile().then(profile => {
          profile.dataValues.created_at = profile.dataValues.created_at.toISOString();
          profile.dataValues.updated_at = profile.dataValues.updated_at.toISOString();

          expect(res.body.profile).to.deep.equal(profile.dataValues);
          done();
        }).catch(done);
      });
    });

    context('when API token is incorrect', () => {
      beforeEach(() => {
        user.token += '*';
      });

      it('returns an unauthorized status', (done) => {
        api
        .profile(user)
        .expect(401, {}, done);
      });
    });
  });

  describe('POST', () => {
    it('updates the user profile', () => {

    });
  });
});
