'use strict';

let moment = require('moment'),
  random = require('../random'),
  Cluster = require('../../../app/models').Cluster;

module.exports = function(factory) {
  factory.define('cluster', Cluster, {
    name: random.string,
  });

  factory.define('emptyCluster', Cluster, {
    name: random.string,
  });

  factory.define('deployingCluster', Cluster, {
    name: random.string,
    last_state: 'deploying',
  });

  factory.define('upgradingCluster', Cluster, {
    name: random.string,
    last_state: 'upgrading'
  });

  factory.define('updatingCluster', Cluster, {
    name: random.string,
    last_state: 'updating'
  });

  factory.define('runningCluster', Cluster, {
    name: random.string,
    last_state: 'running',
    last_seen: moment
  });

  factory.define('unreachableCluster', Cluster, {
    name: random.string,
    last_state: 'running',
    last_seen: moment().subtract(6, 'minutes')
  });

  /*
   * Invalid ids are provided to ensure that they are blacklisted.
   */
  factory.define('forbiddenCluster', Cluster, {
    id: 0,
    user_id: 0,
    name: random.string,
    last_state: 'running',
    last_seen: moment(),
    strategy: 'spread',
    nodes_count: 1,
    containers_count: 2
  });
};
