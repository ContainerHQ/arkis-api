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

    it('fails with a too short fullname', () => {
      let profile = factory.buildSync('profile',
        { fullname: _.repeat('*', 129) }
      );

      expect(profile.save()).to.be.rejected;
    });
  });
});
