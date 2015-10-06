'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  Machine = require('../connectors').Machine;

class ProviderManager {
  constructor(user) {
    this.user    = user;
    this.machine = new Machine(config.auth.machine);
  }
  link(options) {
    return this.machine.addKey(this.user.ssh_key.public).then(id => {
      return this.user.createUserProviderLink({
        type: 'ssh_key', provider_id: id
      }, options);
    });
  }
  unlink(options) {
    let sshKeyLink;

    return this.user.getUserProviderLinks({
      where: { type: 'ssh_key' }
    }, options).then(_.first).then(link => {
      sshKeyLink = link;
      return this.machine.removeKey(sshKeyLink.provider_id).catch(err => {
        if (err.name !== 'MachineNotFoundError') { throw err; }
      });
    }).then(() => {
      return sshKeyLink.destroy(options);
    });
  }
}

module.exports = ProviderManager;
