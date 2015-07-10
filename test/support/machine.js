'use strict';

function rand() {
  return Math.random().toString(36).substr(2);
}

function resolve() {
  return new Promise(resolve => {
    resolve();
  });
}

let machine = {};

/*
 * This is a async method, the real implementation is calling
 * the docker hub in order to create a token.
 */
machine.createToken = function() {
  return new Promise(resolve => {
    resolve(rand() + rand());
  });
};

machine.generateFQDN = function() {
  return rand() + '.node.arkis.io';
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
