'use strict';

let _ = require('lodash'),
  concerns = require('./concerns'),
  Profile = require('../../app/models').Profile;

describe('Profile Model', () => {
  db.sync();

  concerns('profile').serializable({ omit: ['user_id'] });

  concerns('profile').validates({
    fullname: {
      length: { min: 0, max: 64, convert: true }
    },
    company: {
      length: { min: 0, max: 64, convert: true }
    },
    location: {
      length: { min: 0, max: 64, convert: true }
    }
  });

  concerns('emptyProfile').validates();
});
