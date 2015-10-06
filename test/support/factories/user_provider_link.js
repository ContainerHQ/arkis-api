'use strict';

let random = require('../random'),
  UserProviderLink = require('../../../app/models').UserProviderLink;

module.exports = function(factory) {
  factory.define('userProviderLink', UserProviderLink, {
    type: 'ssh_key',
    provider_id: random.string
  });
};
