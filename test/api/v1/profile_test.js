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
      .getProfile(user)
      .expect(200)
      .end((err, res) => {
        if (err) { return done(err); }

        let profile = format.timestamps(res.body.profile);

        expect(user.getProfile())
          .to.eventually.have.property('dataValues')
          .that.deep.equals(profile)
          .notify(done);
      });
    });

    context('when API token is incorrect', () => {
      beforeEach(() => {
        user.revokeToken();
        return user.save();
      });

      it('returns an unauthorized status', (done) => {
        api
        .getProfile(user)
        .expect(401, {}, done);
      });
    });
  });

  describe('PATCH', () => {
    it('updates the user profile', (done) => {
      let fullname = 'Uther Lightbringer';

      api
      .updateProfile(user)
      .field('fullname', fullname)
      .expect(204)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(user.getProfile())
          .to.eventually.have.property('fullname', fullname)
          .notify(done);
      });
    });
  });
});
