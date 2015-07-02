'use strict';

let random = require('./random'),
  machine = {};

/*
 * This is a async method, the real implementation is calling
 * the docker hub in order to create a token.
 */
machine.createToken = function() {
  return new Promise(resolve => {
    resolve(this.createFakeToken());
  });
};

machine.createCerts = function() {
  return new Promise(resolve => {
    resolve(this.createFakeCerts());
  });
};

machine.createFakeToken = function() {
  return rand() + rand();
};

machine.createFakeCerts = function() {
  return {
    client: { cert: rand(), key: rand(), ca: rand() },
    server: { cert: rand(), key: rand(), ca: rand() }
  };
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
