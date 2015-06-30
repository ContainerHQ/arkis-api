'use strict';

let moment = require('moment'),
  Cluster = require('../../app/models').Cluster;

module.exports = function(factory) {
  factory.define('cluster', Cluster, {
    name: 'grounds-production',
  });

  factory.define('defaultCluster', Cluster, {
    name: 'default',
  });

  factory.define('unreachableCluster', Cluster, {
    name: 'unreachable',
    last_state: 'running',
    last_ping: moment().subtract(6, 'minutes')
  });

  /*
   * Attribute id is specified with a non-integer to
   * verify that the db is taking care of the primary
   * key and is not taking into account of one specified
   * in the user payload.
   */
  factory.define('forbiddenCluster', Cluster, {
    id: 'lol',
    name: 'forbidden',
    strategy: 'spread',
    user_id: 45,
    nodes_count: 1,
    containers_count: 2
  });
};
