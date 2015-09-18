'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  config = require('../../config'),
  errors = require('../support').errors;

const RUNNING_STATE = { last_state: 'running' };

class AgentManager {
  constructor(node) {
    this.node = node;
  }
  infos() {
    return this.node.getCluster().then(cluster => {
      return {
        docker: {
          port:    config.agent.ports.docker,
          version: config.latestVersions.docker,
          name:    this.node.name,
          labels:  this.node.labels,
          cert:    cluster.cert
        },
        swarm: {
          port:     config.agent.ports.swarm,
          version:  config.latestVersions.swarm,
          strategy: cluster.strategy,
          master:   this.node.master
        }
      };
    });
  }
  /*
   * Must be called whenever an agent has finished its pending work.
   */
  notify(attributes={}) {
    return this.node.update(_.merge(this._notifyAttributes, attributes))
    .then(() => {
      return this.node.getCluster();
    }).then(cluster => {
      return cluster.notify(RUNNING_STATE);
    }).then(() => {
      return this.node.getActions({ scope: 'pending' });
    }).then(_.first).then(action => {
      return action ? action.complete() : Promise.resolve(null);
    });
  }
  /*
   * Called by the swarm agent to register that the docker daemon is running on
   * this ip.
   */
  register(addr) {
    /*
     * public_ip is allowed to be null in the database, therefore this hack is
     * required to trigger a validation error when address is not defined.
     */
    let public_ip = _.first((addr || 'null').split(':'));

    return this.node.update({ public_ip: public_ip, last_seen: moment() });
  }
  /*
   * Called by the swarm manager to list the running nodes of the same cluster.
   * We must first ensure that the agent is verified as the master node of its
   * cluster.
   */
  fetch() {
    if (this.isSlave) { return Promise.reject(new errors.NotMasterError()); }

    return this.node.getCluster().then(cluster => {
      return cluster.notify({ last_seen: moment() });
    }).then(cluster => {
      return cluster.getNodes({ scope: ['defaultScope', 'runningIPs'] });
    }).then(nodes => {
      return _.map(nodes, node => {
        return `${node.public_ip}:${config.agent.ports.docker}`;
      });
    });
  }
  get isSlave() {
    return !this.node.master;
  }
  get _notifyAttributes() {
    if (this.node.state === 'deploying') {
      return _.merge({ deployed_at: moment() }, RUNNING_STATE);
    }
    return RUNNING_STATE;
  }
}

module.exports = AgentManager;
