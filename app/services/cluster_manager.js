'use strict';

let _ = require('lodash'), config = require('../../config'),
  AuthorizeManager = require('./authorize_manager'),
  DaemonManager = require('./daemon_manager');

const LATEST_VERSIONS = {
  docker_version: config.latestVersions.docker,
  swarm_version:  config.latestVersions.swarm
};

class ClusterManager extends AuthorizeManager {
  constructor(cluster) {
    super(cluster, LATEST_VERSIONS);

    this.cluster = cluster;
  }
  /*
   * Upgrade a cluster to the latest versions available and perform a
   * node upgrade on all cluster nodes.
   *
   * When a node is updated, the cluster is notified and update its
   * state accordingly, beside, when every node upgrade call fails,
   * the cluster state must not changed to. Therefore we don't need
   * to update the state here. However, versions must be updated,
   * the node agent will automatically get these informations when
   * the node will be restarted.
   */
  upgrade() {
    if (this.isConflicted)      { return this.conflict('upgrade'); }
    if (this.isAlreadyUpgraded) { return this.alreadyUpgraded(); }

    return this.getNodesDaemons().then(daemons => {
      _.invoke(daemons, 'upgrade');

      return this.cluster.update(LATEST_VERSIONS);
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
