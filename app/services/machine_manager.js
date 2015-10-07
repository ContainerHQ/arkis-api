'use strict';

let _ = require('lodash'),
  sequelize = require('../models').sequelize,
  config = require('../../config'),
  Machine = require('../connectors').Machine;

class MachineManager {
  constructor(cluster, node, user) {
    this.cluster = cluster;
    this.node    = node;
    this.user    = user;
    this.machine = new Machine(config.auth.machine);
  }
  get nodeId() {
    return this.node.id;
  }
  deploy() {
    let action;

    this.node.cluster_id = this.cluster.id;

    return sequelize.transaction(t => {
      let options = { transaction: t };

      return this.node.save(options).then(() => {
        return this.node.createAction({ type: 'deploy' }, options);
      }).then(createdAction => {
        action = createdAction;
        return this.cluster.update({ last_state: 'deploying' }, options);
      }).then(() => {
        return this._createMachine();
      });
    }).then(id => {
      return this.node.update({ provider_id: id }).return(action);
    });
  }
  destroy() {
    return sequelize.transaction(t => {
      let options = { transaction: t };

      return this.node.getActions(options)
      .then(actions => {
        return Promise.all(_.invoke(actions, 'destroy', options));
      }).then(() => {
        return this.node.destroy(options);
      }).then(() => {
        return this.cluster.adaptStateTo({
          action:  'destroyed',
          node:    this.node,
          options: options
        });
      }).then(() => {
        return this._deleteMachine();
      });
    });
  }
  _createMachine() {
    if (this.node.byon) { return Promise.resolve(); }

    return this.user.getSSHKeyLink().then(sshKeyLink => {
      return this.machine.create({
        name:   this.node.id,
        region: this.node.region,
        size:   this.node.size,
        ssh_keys: [sshKeyLink.provider_id]
      });
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
