'use strict';

let config = require('../../config'),
  Machine = require('../connectors').Machine;

module.exports = function(queue) {
  let ActionJob   = require('./action_job')(queue);
  //  NodeProvision = require('./node_provision')(queue);

  class NodeDeploy extends ActionJob {
    constructor(action) {
      super(action);

      this.type = 'node-deploy';
    }
    get nodeId() {
      return this.action.resource_id;
    }
    process() {
      let models;

      return this.retrieve(['Cluster', 'User']).then(res => {
        models = res;
        return models.user.getSSHKeyLink();
      }).then(sshKeyLink => {
        return new Machine(config.auth.machine).create({
          name:   models.node.id,
          region: models.node.region,
          size:   models.node.size,
          ssh_keys: [sshKeyLink.provider_id]
        });
      }).then(id => {
        return models.node.update({ provider_id: id });
      });
    }
  }
  return NodeDeploy;
};
