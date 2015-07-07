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

machine.createToken = function() {
  return new Promise(resolve => {
    resolve(rand() + rand());
  });
};

[
  'deleteToken', 'registerFQDN', 'create', 'upgrade', 'destroy'
].forEach(method => {
  machine[method] = resolve;
});

module.exports = machine;
