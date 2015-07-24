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
   * Attribute id is specified with a non-integer to
   * verify that the db is taking care of the primary
   * key and is not taking into account of one specified
   * in the user payload.
   */
  factory.define('forbiddenCluster', Cluster, {
    id: 'lol',
    name: random.string,
    strategy: 'spread',
    user_id: 45,
    nodes_count: 1,
    containers_count: 2
  });
};
