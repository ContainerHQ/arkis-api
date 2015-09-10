'use strict';

let _ = require('lodash'),
  concerns = require('./concerns'),
  Profile = require('../../app/models').Profile;

describe('Profile Model', () => {
  db.sync();

  concerns('profile').serializable({ omit: ['user_id'] });

  describe('validations', () => {
    it('succeeds without attributes', () => {
     return expect(Profile.create()).to.be.fulfilled;
    });

    it('succeeds with empty attributes', () => {
      let profile = factory.buildSync('emptyProfile');

      return expect(profile.save()).to.be.fulfilled;
    });

    it('succeeds with valid attributes', done => {
      factory.create('profile', done);
    });

    it('succeeds with attributes at max size', done => {
      factory.create('maxSizeProfile', done);
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
