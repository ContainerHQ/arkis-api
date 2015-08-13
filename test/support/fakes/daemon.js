'use strict';

let daemon = {};

daemon.upgrade = function() {
  return Promise.resolve();
};

daemon.update = function() {
  return Promise.resolve();
};

module.exports = daemon;
