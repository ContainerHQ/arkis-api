'use strict';

module.exports.string = function() {
  return Math.random().toString(36).substr(2);
};

module.exports.positiveInt = function(max) {
  return Math.floor(Math.random() * (max + 2));
}
