'use strict';

let discovery = {};

discovery.createToken = function() {
  return Promise.resolve(random.string() + random.string());
};

discovery.deleteToken = function() {
  return Promise.resolve();
};

module.exports = discovery;
