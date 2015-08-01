'use strict';

let moment = require('moment'),
  random = require('../support/random'),
  Cluster = require('../../app/models').Cluster;

module.exports = function(factory) {
  factory.define('cluster', Cluster, {
    name: random.string,
  });

  factory.define('defaultCluster', Cluster, {
    name: random.string,
  });

  factory.define('unreachableCluster', Cluster, {
    name: random.string,
    last_state: 'running',
    last_ping: moment().subtract(6, 'minutes')
  });

  factory.define('runningCluster', Cluster, {
    name: random.string,
    last_state: 'running',
    last_ping: moment()
  });

  /*
   * Invalid ids are provided to ensure that they are blacklisted.
   */
  factory.define('forbiddenCluster', Cluster, {
    id: 0,
    user_id: 0,
    name: random.string,
    strategy: 'spread',
    nodes_count: 1,
    containers_count: 2
  });
};
