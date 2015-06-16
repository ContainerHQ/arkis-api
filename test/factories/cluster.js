'use strict';

let Cluster = require('../../app/models').Cluster;

module.exports = function(factory) {
  factory.define('cluster', Cluster, {
    name: 'grounds-production',
  });

  factory.define('defaultCluster', Cluster, {
    name: 'default',
  });
};
