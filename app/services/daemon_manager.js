'use strict';

let _ = require('lodash'),
  StateManager = require('./state_manager'),
  Daemon = require('../support').Daemon;

const UPDATING_STATE  = { last_state: 'updating'  },
      UPGRADING_STATE = { last_state: 'upgrading' };

class DaemonManager extends StateManager {
  constructor(cluster, node) {
    super(node, cluster);

    this.cluster = cluster;
    this.node    = node;
    this.daemon  = new Daemon(node);
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
    if (this.isConflicted)      { return this.conflict('update');    }
    if (_.isEmpty(attributes))  { return Promise.resolve(null); }

    let changes = this._updateChanges(attributes);

    _.merge(this.node, attributes, UPDATING_STATE);

    return this.node.validate().then(err => {
      if (err) { return Promise.reject(err); }

      return this.daemon.update(attributes);
    }).then(() => {
      return this.node.save();
    }).then(() => {
      return this.cluster.notify(changes);
    }).then(() => {
      return this.node.createAction({ type: 'update' });
    });
  }
  _updateChanges(attributes) {
    let changes = {};

    if (attributes.master === true && !this.node.master) {
      _.merge(changes, { last_ping: this.node.last_ping });
    }
    if (attributes.master === false && this.node.master) {
      _.merge(changes, { last_ping: null });
    }
    return _.merge(changes, UPDATING_STATE);
  }
  /*
   * Upgrade a node daemon to its cluster versions.
   */
  upgrade() {
    if (this.isConflicted)      { return this.conflict('upgrade'); }
    if (this.isAlreadyUpgraded) { return this.alreadyUpgraded(); }

    return this.daemon.upgrade(this.cluster).then(() => {
      return this.node.update(UPGRADING_STATE);
    }).then(() => {
      return this.cluster.notify(UPGRADING_STATE);
    }).then(() => {
      return this.node.createAction({ type: 'upgrade' });
    });
  }
}

module.exports = DaemonManager;
