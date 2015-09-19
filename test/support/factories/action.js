'use strict';

let moment = require('moment'),
  random = require('../random'),
  config = require('../../../config'),
  Action = require('../../../app/models').Action;

module.exports = function(factory) {
  factory.define('action', Action, {
    type: 'deploy',
    resource: 'node',
    resource_id: random.uuid
  });

  factory.define('in-progressAction', Action, {
    type: 'deploy',
    resource: 'node',
    resource_id: random.uuid,
    last_state: 'in-progress',
    started_at: moment
  });

  factory.define('completedAction', Action, {
    type: 'upgrade',
    resource: 'node',
    resource_id: random.uuid,
    last_state: 'completed',
    completed_at: moment
  });

  factory.define('erroredAction', Action, {
    type: 'update',
    resource: 'node',
    resource_id: random.uuid,
    last_state: 'in-progress',
    started_at: function() {
      let { amount, key } = config.agent.heartbeat;

      return moment().subtract(amount + 1, key);
    }
  });
};
