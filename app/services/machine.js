'use strict';

let machine = {};

machine.create = function() {
  return Promise.resolve();
};

machine.destroy = function() {
  return Promise.resolve();
};

module.exports = require('../../test/support/fakes/machine');
