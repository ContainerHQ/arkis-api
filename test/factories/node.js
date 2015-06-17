'use strict';

let Node = require('../../app/models').Node;

module.exports = function(factory) {
  factory.define('node', Node, {});

  factory.define('upgradingNode', Node, {
    state: 'upgrading',
  });
};
