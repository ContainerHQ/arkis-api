'use strict';

class Daemon {
  constructor(node) {
    this.node = node;
  }
  update() {
    return Promise.resolve();
  }
  upgrade() {
    return Promise.resolve();
  }
}

module.exports = Daemon;
