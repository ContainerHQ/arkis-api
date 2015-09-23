'use strict';

let _ = require('lodash'), config = require('../../config'),
  errors = require('../support').errors,
  StateManager = require('./state_manager'),
  DaemonManager = require('./daemon_manager'),
  MachineManager = require('./machine_manager');

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

    let result = { actions: [], errors: [] };

    return this.cluster.update(LATEST_VERSIONS).then(() => {
      return this.getNodes('DaemonManager');
    }).then(daemons => {
      return Promise.all(_.map(daemons, daemon => {
        return daemon.upgrade().then(action => {
          result.actions.push(action);
        }).catch(err => {
          result.errors.push({
            name: err.name,
            message: err.message,
            resource: 'node',
            resource_id: daemon.node.id
          });
        });
      }));
    }).then(() => { return result; });
  }
  destroy() {
    let deletionErrors = [];

    return this.getNodes('MachineManager').then(machines => {
      return Promise.all(_.map(machines, machine => {
        return machine.destroy().catch(err => {
          deletionErrors.push({
            name: err.name,
            message: err.message,
            resource: 'node',
            resource_id: machine.node.id
          });
        });
      }));
    }).then(() => {
      if (!_.isEmpty(deletionErrors)) {
        return Promise.reject(new errors.DeletionError(deletionErrors));
      }
      return this.cluster.destroy();
    });
  }
  getNodes(service) {
    return this.cluster.getNodes().then(nodes => {
      return _.map(nodes, node => {
        switch (service) {
          case 'DaemonManager':
            return new DaemonManager(this.cluster, node);
          case 'MachineManager':
            return new MachineManager(this.cluster, node);
        }
      });
    });
  }
}

module.exports = ClusterManager;
