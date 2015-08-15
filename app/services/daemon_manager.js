'use strict';

let _ = require('lodash'),
  Daemon = require('./daemon');

class DaemonManager {
  constructor(cluster, node) {
    this.cluster = cluster;
    this.node    = _.first(node);
    this.daemon = new Daemon(node);
  }
}

module.exports = DaemonManager;
