'use strict';

function rand() {
  return Math.random().toString(36).substr(2);
}

let machine = {};

machine.createToken = function() {
  return new Promise(resolve => {
    resolve(rand() + rand());
  });
};

machine.deleteToken = function(token) {
  return new Promise(resolve => {
    resolve();
  });
};

module.exports = machine;
