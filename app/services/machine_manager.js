'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  Machine = require('../connectors').Machine;

class MachineManager {
  constructor(cluster, node) {
    this.cluster = cluster;
    this.node    = node;
    this.machine = new Machine(config.auth.machine);
  }
  get nodeId() {
    return this.node.id;
  }
  deploy() {
    return this.node.validate().then(err => {
      if (err) { return Promise.reject(err); }

      return this._createMachine();
    }).then(id => {
      this.node.provider_id = id;
      this.node.cluster_id  = this.cluster.id;
      return this.node.save();
    }).then(() => {
      return this.cluster.notify(this.deployChanges);
    }).then(() => {
      return this.node.createAction({ type: 'deploy' });
    });
  }
  destroy() {
    return this._deleteMachine().then(() => {
      return this.node.destroy();
    }).then(() => {
      return this.cluster.notify(this.destroyChanges);
    }).then(() => {
      return this.node.getActions();
    }).then(actions => {
      return Promise.all(_.invoke(actions, 'destroy'));
    });
  }
  get deployChanges() {
    return _.pick(this.node, 'last_state');
  }
  get destroyChanges() {
    let changes = this.node.master ? { last_seen: null } : {};

    return _.merge(changes, { last_state: 'destroyed' });
  }
  _createMachine() {
    return this.node.byon ? Promise.resolve() : this.machine.create({
      name:   this.node.id,
      region: this.node.region,
      size:   this.node.size
    });
  }
  _deleteMachine()  {
    let deletion = this.node.byon ? Promise.resolve() : this.machine.delete(
      this.node.provider_id
    );
    /*
     * If the machine behind has been manually deleted on the provider API,
     * we still want the node to be deleted as this node is dead anyway.
     * Therefore we can safely ignore this error.
     */
    return deletion.catch(err => {
      if (err.name !== 'MachineNotFoundError') { throw err; }
    });
  }
}

module.exports = MachineManager;
