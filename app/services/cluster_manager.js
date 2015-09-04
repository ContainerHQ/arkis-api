'use strict';

let _ = require('lodash'), config = require('../../config'),
  StateManager = require('./state_manager'),
  DaemonManager = require('./daemon_manager');

const LATEST_VERSIONS = {
  docker_version: config.latestVersions.docker,
  swarm_version:  config.latestVersions.swarm
};

class ClusterManager extends StateManager {
  constructor(cluster) {
    super(cluster, LATEST_VERSIONS);

    this.cluster = cluster;
  }
  /*
   * Upgrade a cluster to the latest versions available and perform a
   * node upgrade on all cluster nodes.
   *
   * When a node is updated, its cluster is notified and update its
   * state accordingly, beside, when every node upgrade call fails,
   * the cluster state must not changed to. Therefore we don't need
   * to update the state here. However, versions must be updated,
   * the node agent will automatically get these informations when
   * the node will be restarted.
   */
  upgrade() {
    if (this.isConflicted)      { return this.conflict('upgrade'); }
    if (this.isAlreadyUpgraded) { return this.alreadyUpgraded(); }

    return this.cluster.update(LATEST_VERSIONS).then(() => {
      return this.getNodesDaemons();
    }).then(daemons => {
      return Promise.all(_.map(daemons, daemon => {
        return daemon.upgrade().then(
          action => { return { actions: action }; },
          error  => {
            return { errors: {
              resource: 'node',
              resource_id: daemon.node.id,
              message: error.message
            }};
          }
        );
      }));
    }).then(results => {
      return _.mapValues({ actions: [], errors: [] }, (value, key) => {
        return _(results).pluck(key).pull(undefined).value();
      });
    });
  }
  getNodesDaemons() {
    return this.cluster.getNodes().then(nodes => {
      return _.map(nodes, node => {
        return new DaemonManager(this.cluster, node);
      });
    });
  }
}

module.exports = ClusterManager;
