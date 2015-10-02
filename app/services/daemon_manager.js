'use strict';

let _ = require('lodash'),
  sequelize = require('../models').sequelize,
  StateManager = require('./state_manager'),
  Daemon = require('../connectors').Daemon;

const UPDATING_STATE  = { last_state: 'updating'  },
      UPGRADING_STATE = { last_state: 'upgrading' };

class DaemonManager extends StateManager {
  constructor(cluster, node) {
    super(node, cluster);

    this.cluster = cluster;
    this.node    = node;
    this.daemon  = new Daemon(node);
  }
  get nodeId() {
    return this.node.id;
  }
  /*
   * Update commits to the machine some changes and update the node
   * accordingly and also ensures to put the node in updating state, until
   * the node agent registers that it has finished to process the changes.
   *
   * This method is almost agnostic from changes nature. It's up to the caller
   * to filter the changes that must be processed.
   *
   * However, if the cluster's master node changes, it will be notified
   * accordingly.
   */
  update(attributes={}) {
    if (this.isConflicted)      { return this.conflict('update'); }
    if (_.isEmpty(attributes))  { return Promise.resolve(null); }

    let masterSwitch = this.node.master !== attributes.master;

    return sequelize.transaction(t => {
      let options = { transaction: t }, action;

      return this.node.createAction({ type: 'update' }, options)
      .then(createdAction => {
        action = createdAction;
        return this.node.update(
          _.merge({}, attributes, UPDATING_STATE),
          options
        );
      }).then(() => {
        return this.cluster.adaptStateTo({
          action:  'update',
          node:    this.node,
          options: options,
          masterSwitch: masterSwitch
        });
      }).then(() => {
        return this.daemon.update(attributes);
      }).then(() => {
        return action;
      });
    });
  }
  /*
   * Upgrade a node daemon to its cluster versions.
   */
  upgrade() {
    if (this.isConflicted)      { return this.conflict('upgrade'); }
    if (this.isAlreadyUpgraded) { return this.alreadyUpgraded(); }

    return sequelize.transaction(t => {
      let options = { transaction: t }, action;

      return this.node.createAction({ type: 'upgrade' }, options)
      .then(createdAction => {
        action = createdAction;
        return this.node.update(UPGRADING_STATE, options);
      }).then(() => {
        return this.cluster.update(UPGRADING_STATE, options);
      }).then(() => {
        return this.daemon.upgrade({
          docker: this.cluster.docker_version,
          swarm:  this.cluster.swarm_version
        });
      }).then(() => {
        return action;
      });
    });
  }
}

module.exports = DaemonManager;
