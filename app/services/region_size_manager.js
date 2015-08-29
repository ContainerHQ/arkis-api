'use strict';

let config = require('../../config'),
  Machine = require('../connectors').Machine;

class RegionSizeManager {
  constructor() {
    this.machine = new Machine(config.auth.machine);
  }
  getRegions() {
    return this.machine.getRegions();
  }
  getSizes() {
    return this.machine.getSizes();
  }
}

module.exports = RegionSizeManager;
