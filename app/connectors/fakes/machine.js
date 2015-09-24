'use strict';

let errors = require('../../support').errors;

const UNPROCESSABLE_MESSAGE = 'Invalid region/size for macine creation';

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
    return Promise.resolve([{ name: 'Amsterdam 3',
      slug: 'ams3',
      sizes: [ '32gb', '16gb'],
      available: true
    }, {
      name: 'Frankfurt 1',
      slug: 'fra1',
      sizes: [ '32gb', '16gb'],
      available: true
    }]);
  }
  getSizes() {
    return Promise.resolve([{
      slug: '48gb',
      memory: 49152,
      disk: 480,
      transfer: 8,
      price_monthly: 480,
      price_hourly: 0.71429,
      regions:
       [ 'sgp1',
         'nyc1',
         'lon1',
         'nyc2',
         'ams3',
         'nyc3',
         'ams2',
         'sfo1',
         'fra1' ],
      available: true,
      cpu: 16
    }, {
      slug: '64gb',
      memory: 65536,
      disk: 640,
      transfer: 9,
      price_monthly: 640,
      price_hourly: 0.95238,
      regions:
       [ 'sgp1',
         'nyc1',
         'nyc2',
         'lon1',
         'ams3',
         'nyc3',
         'ams2',
         'sfo1',
         'fra1' ],
      available: true,
      cpu: 20
    }]);
  }
  create(options) {
    if (!this.credentials) {
      return new errors.MachineCredentialsError();
    }
    if (!options.region || !options.size) {
      return Promise.reject(
        new errors.MachineUnprocessableError(UNPROCESSABLE_MESSAGE)
      );
    }
    return Promise.resolve(options.name);
  }
  delete() {
    if (!this.credentials) {
      return new errors.MachineCredentialsError();
    }
    return Promise.resolve();
  }
}

module.exports = Machine;
