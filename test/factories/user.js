'use strict';

var User = require('../../app/models').User;

module.exports = function(factory) {
  factory.define('user', User, {
    email: 'max@furyroad.io',
    password: 'allm8tyMax'
  });

  factory.define('defaultUser', User, {
    email: 'default@arkis.io',
    password: 'allm8tyMax'
  });
};
