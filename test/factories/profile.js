'use strict';

let _ = require('lodash'),
  Profile = require('../../app/models').Profile;

module.exports = function(factory) {
  factory.define('profile', Profile, {
    fullname: 'Luke Skywalker',
    location: 'Tatooine',
    company: 'Jedi Academy, Inc',
  });

  factory.define('profileMaxSize', Profile, {
    fullname: _.repeat('*', 64),
    location: _.repeat('*', 64),
    company:  _.repeat('*', 64),
  });

  factory.define('emptyProfile', Profile, {
    fullname: '',
    location: '',
    company: '',
  });
};
