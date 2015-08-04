'use strict';

let random = {};

random.string = function() {
  return Math.random().toString(36).substr(2);
};

random.positiveInt = function(max) {
  return Math.floor(Math.random() * (max + 2));
};

random.email = function() {
  return random.string() + '@arkis.io';
};

module.exports = random;
