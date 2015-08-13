'use strict';

let random = require('../random'),
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
  return ;
};

machine.createFakeCerts = function() {
  return {
    client: { cert: random.string(), key: random.string(), ca: random.string() },
    server: { cert: random.string(), key: random.string(), ca: random.string() }
  };
};

machine.agentCmd = function(token) {
  return `curl -Ls https://get.arkis.io/ | sudo -H sh -s ${token}`;
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
  'update',
  'destroy'
].forEach(method => {
  machine[method] = function() {
    return Promise.resolve();
  };
});

module.exports = machine;
