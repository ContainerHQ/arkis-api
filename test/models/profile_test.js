'use strict';

let Profile = require('../../app/models').Profile;

describe('Profile Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeed without attributes', () => {
     return expect(Profile.create()).to.be.fulfilled;
    });

    it('succeed with empty attributes', () => {
      let profile = factory.buildSync('emptyProfile');

      return expect(Profile.create()).to.be.fulfilled;
    });

    it('succeed with valid attributes', done => {
      factory.create('profile', done);
    });

    it('succeed with attributes at max size', done => {
      factory.create('profileMaxSize', done);
    });

    ['fullname', 'company', 'location'].forEach(attribute => {
      it(`fails with a too long ${attribute}`, () => {
        let params = {};

        params[attribute] = _.repeat('*', 65);

        let profile = factory.buildSync('profile', params);

        return expect(profile.save()).to.be.rejected;
      });
    });
  });
});
