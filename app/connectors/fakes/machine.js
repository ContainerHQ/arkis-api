'use strict';

let errors = require('../../support').errors;

class Machine {
  constructor(credentials) {
    this.credentials = credentials;
  }
  verifyCredentials() {
    if (!this.credentials) {
      return new errors.MachineCredentialsError();
    }
    return Promise.resolve();
  }
  getRegions() {
    return Promise.resolve();
  }
  getSizes() {
    return Promise.resolve();
  }
  create(options) {
    if (!this.credentials) {
      return new errors.MachineCredentialsError();
    }
    if (!options.region || !options.size) {
      return Promise.reject(new errors.MachineInvalidError());
    }
    return Promise.resolve(options.name);
  }
  delete(id) {
    if (!this.credentials) {
      return new errors.MachineCredentialsError();
    }
    if (id <= 0) { return Promise.reject(new errors.MachineNotFoundError()); }

    return Promise.resolve();
  }
}

module.exports = Machine;
