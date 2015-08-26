'use strict';

let _ = require('lodash');

let providers = {
  Digitalocean: require('./digital_ocean')
};

module.exports.getClient = function(provider, credentials) {
  let providerName = _.capitalize(provider);

  return new providers[providerName](credentials);
};
