'use strict';

let _ = require('lodash'),
  Machine = require('../support').Machine;

class MachineManager {
  constructor(cluster, node) {
    this.cluster = cluster;
    this.node    = node;
    this.machine = new Machine(node);
  }
  deploy() {
    return this.node.validate().then(err => {
      if (err) { return Promise.reject(err); }

      return this._createMachine();
    }).then(() => {
      return this.cluster.addNode(this.node);
    }).then(() => {
      return this.cluster.notify(this.deployChanges);
    });
  }
  destroy() {
    return this._deleteMachine().then(() => {
      return this.node.destroy();
    }).then(() => {
      return this.cluster.notify(this.destroyChanges);
    });
  }
  get deployChanges() {
    return _.pick(this.node, 'last_state');
  }
  get destroyChanges() {
    let changes = this.node.master ? { last_ping: null } : {};

    return _.merge(changes, { last_state: 'destroyed' });
  }
  _createMachine() {
    return this.node.byon ? Promise.resolve() : this.machine.create();
  }
  _deleteMachine()  {
    return this.node.byon ? Promise.resolve() : this.machine.delete();
  }
}

module.exports = MachineManager;
