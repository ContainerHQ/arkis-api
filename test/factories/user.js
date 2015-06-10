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

  factory.define('forbiddenUser', User, {
    email: 'forbidden@arkis.io',
    password: 'azerty28',
    provider: 'whatever',
    provider_id: 23,
    token: 'azerty',
    token_id: '04490f90-0f77-11e5-b3e6-eb141641cd59'
  });
};
