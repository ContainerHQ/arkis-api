'use strict';

let _ = require('lodash');

const WHITELIST = ['fullname', 'location', 'company'];

describe('PATCH /account/profile', () => {
  db.sync();
  db.create(['user']);

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('updates the user profile', done => {
    let form = factory.buildSync('profile').dataValues,
      expected = _.pick(form, WHITELIST);

    api.account(user).updateProfile().send(form)
    .expect(200, has.one(user, 'profile', { with: expected }, done));
  });

  context('with invalid attributes', () => {
    it('responds with a bad request status and validation errors', done => {
      let fullname = _.repeat('*', 65);

      api.account(user).updateProfile()
      .field('fullname', fullname)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        user.getProfile().then(profile => {
          return profile.update({ fullname: fullname });
        }).then(done).catch(err => {
          expect(res.body).to.deep.equal(format.error(err));
        }).then(done).catch(done);
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
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expect(user.getProfile()).to.eventually.exist
          .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().updateProfile().expect(401, done);
    });
  });
});
