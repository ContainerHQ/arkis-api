'use strict';

let _ = require('lodash');

const WHITELIST = ['fullname', 'location', 'company'];

describe('PATCH /account/profile', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('updates the user profile', done => {
    let form = factory.buildSync('profile').dataValues;

    api.account(user).updateProfile()
    .send(form)
    .expect(200)
    .end((err, res) => {
      if (err) { return done(err); }

      let profile = format.timestamps(res.body.profile);

      user.getProfile().then(userProfile => {
        expect(profile).to.deep.equal(userProfile.toJSON())
          .and.include(_.pick(form, WHITELIST));
        done();
      }).catch(done);
    });
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status and validation errors', done => {
      let fullname = _.repeat('*', 65);

      api.account(user).updateProfile()
      .field('fullname', fullname)
      .expect(400)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(
          user.getProfile()
          .then(profile => {
            profile.fullname = fullname;
            return profile.save();
        }))
        .to.be.rejectedWith(res.body.errors)
        .notify(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    /*
     * Basically for profile, every attributes are customizable by the user,
     * therefore we just need to verify that the id/user_id of the profile
     * can't be updated.
     */
    it('these attributes are filtered', done => {
      api.account(user).updateProfile()
      .field('id', 'lol')
      .field('user_id', 1)
      .expect(200)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(user.getProfile()).to.eventually.exist
          .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().updateProfile()
      .expect(401, done);
    });
  });
});
