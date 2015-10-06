'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  Machine = require('../connectors').Machine;

class ProviderManager {
  constructor(user) {
    this.user    = user;
    this.machine = new Machine(config.auth.machine);
  }
  link() {
    return this.machine.addKey(this.user.ssh_key.public).then(id => {
      return this.user.createUserProviderLink({
        type: 'ssh_key', provider_id: id
      });
    });
  }
  unlink() {
    let sshKeyLink;

    return this.user.getUserProviderLinks({
      where: { type: 'ssh_key' }
    }).then(_.first).then(link => {
      sshKeyLink = link;
      return this.machine.removeKey(sshKeyLink.provider_id);
    }).then(() => {
      return sshKeyLink.destroy();
    });
  }
}

module.exports = ProviderManager;
