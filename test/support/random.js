'use strict';

let _ = require('lodash'),
  uuid = require('node-uuid'),
  Chance = require('chance'),
  chance = new Chance(),
  random = {};

random.string = function() {
  return Math.random().toString(36).substr(2);
};

random.error = function() {
  return new Error(random.string());
};

random.positiveInt = function(max) {
  return chance.integer({ min: 1, max: max });
};

random.integer = function(opts) {
  return chance.integer(opts);
};

random.email = function() {
  return random.string() + '@arkis.io';
};

random.ip = function() {
  return chance.ip();
};

random.uuid = function() {
  return uuid.v1();
};

random.obj = function() {
  let count = random.positiveInt(10), obj = {};

  _.times(count, () => {
    obj[random.string()] = random.string();
  });
  return obj;
};

module.exports = random;
