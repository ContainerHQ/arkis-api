'use strict';

let User = require('../../app/models').User;

module.exports = function(factory) {
  factory.define('user', User, {
    email: 'max@furyroad.io',
    password: 'allm8tyMax',
  });

  factory.define('defaultUser', User, {
    email: 'default@arkis.io',
    password: 'allm8tyMax'
  });

  /*
   * Attribute id is specified with a non-integer to
   * verify that the db is taking care of the primary
   * key and is not taking into account of one specified
   * in the user payload.
   */
  factory.define('forbiddenUser', User, {
    id: 'lol',
    email: 'forbidden@arkis.io',
    password: 'azerty28',
    password_hash: 'whatever',
    provider: 'whatever',
    provider_id: 23,
    token: 'azerty',
    token_id: '04490f90-0f77-11e5-b3e6-eb141641cd59'
  });
};
