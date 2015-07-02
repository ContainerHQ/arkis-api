'use strict';

let random = require('./random'),
  machine = {};

/*
 * This is a async method, the real implementation is calling
 * the docker hub in order to create a token.
 */
machine.createToken = function() {
  return new Promise(resolve => {
    resolve(random.string() + random.string());
  });
};

machine.generateFQDN = function() {
  return random.string() + '.node.arkis.io';
};

[
  'deleteToken',
  'registerFQDN',
  'deleteFQDN',
  'create',
  'upgrade',
  'destroy'
].forEach(method => {
  machine[method] = resolve;
});

module.exports = machine;
