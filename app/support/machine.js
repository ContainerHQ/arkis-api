'use strict';

class Machine {
  constructor(node) {
    this.node = node;
  }
  create() {
    return Promise.resolve();
  }
  delete() {
    return Promise.resolve();
  }
}

module.exports = Machine;
