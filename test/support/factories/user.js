'use strict';

let random = require('../random'),
  uuid = require('node-uuid'),
  User = require('../../../app/models').User;

module.exports = function(factory) {
  factory.define('user', User, {
    email: random.email,
    password: 'allm8tyMax',
  });

  /*
   * Invalid ids are provided to ensure that they are blacklisted.
   */
  factory.define('forbiddenUser', User, {
    id: 0,
    email: random.email,
    password: 'azerty28',
    password_hash: 'whatever',
    provider: 'whatever',
    provider_id: 23,
    encrypted_token: random.string,
    token_id: function() {
      return uuid.v1();
    },
    ssk_key: random.string
  });
};
