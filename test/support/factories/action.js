'use strict';

let random = require('../random'),
  Action = require('../../../app/models').Action;

module.exports = function(factory) {
  factory.define('action', Action, {
    type: 'deploy',
    resource: 'Node',
    resource_id: random.uuid
  });
};
