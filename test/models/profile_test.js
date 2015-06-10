'use strict';

var Profile = require('../../app/models').Profile;

describe('Profile Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeed without attributes', () => {
      expect(Profile.create()).to.be.fulfilled;
    });

    it('succeed with valid attributes', done => {
      factory.create('profile', done);
    });
  });

  it('belongs to a user', done => {
    factory.create('profile', (err, profile) => {
      if (err) { return done(err); }

      expect(profile.user_id).not.to.be.null;
      done();
    });
  });
});
