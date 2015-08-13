'use strict';

let random = require('../random'),
  machine = {};

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
