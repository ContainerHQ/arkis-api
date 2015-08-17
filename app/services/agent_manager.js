'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../support').errors,
  config = require('../../config');
  //models = require('../models');

const CLUSTER_INFOS = ['docker_version', 'swarm_version', 'strategy', 'cert'],
      NODE_INFOS    = ['name', 'master', 'labels'],
      CONFIG_INFOS  = ['dockerPort', 'swarmPort'];

class AgentManager {
  constructor(node) {
    this.node = node;
  }
  infos() {
    return this.node.getCluster().then(cluster => {
      return _.merge(this.config,
        _.pick(cluster,   CLUSTER_INFOS),
        _.pick(this.node, NODE_INFOS)
      );
    });
  }
  /*
   * Must be called whenever an agent has finished its pending work.
   */
  notify(attributes={}) {
    return this.node.update(
      _.merge(attributes, { last_state: 'running' })
    );
  }
  /*
   * Called by the swarm agent to notify that the docker daemon is running on
   * this ip.
   */
  register(addr) {
    /*
     * public_ip is allowed to be null in the database, therefore this hack is
     * required to trigger a validation error when address is not defined.
     */
    let public_ip = _.first((addr || 'null').split(':'));

    return this.node.update({ public_ip: public_ip, last_ping: moment() });
  }
  /*
   * Called by the swarm manager to list the running nodes of the same cluster.
   * We must ensure first that the agent is verified has the master node of its
   * cluster.
   */
  fetch() {
    if (this.isSlave()) { return Promise.reject(new errors.NotMasterError()); }
  }
  get isSlave() {
    return !this.node.master;
  }
  get config() {
    return _(config)
    .pick(CONFIG_INFOS)
    .mapKeys((value, key) => {
      return _.snakeCase(key);
    }).value();
  }
}

module.exports = AgentManager;
