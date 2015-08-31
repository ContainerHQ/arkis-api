'use strict';

let random = require('../random'),
  Action = require('../../../app/models').Action;

module.exports = function(factory) {
  factory.define('action', Action, {
    type: 'deploy',
    ressource: 'Node',
    ressource_id: random.uuid
  });
};
