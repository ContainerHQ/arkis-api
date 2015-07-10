'use strict';

let Node = require('../../app/models').Node;

module.exports = function(factory) {
  factory.define('node', Node, {
    name: 'battlestar.apps',
    region: 'london',
    node_size: 'deathstar'
  });

  factory.define('byonNode', Node, {
    name: 'byon',
    byon: true,
  });

  factory.define('registeredNode', Node, {
    name: 'registered',
    master: true,
    region: 'london',
    node_size: 'deathstar',
    public_ip: '192.168.212.128',
    last_state: 'running'
  });

  factory.define('runningNode', Node, {
    name: 'running',
    master: false,
    byon: true,
    public_ip: '192.168.212.129',
    last_state: 'running',
    last_ping: Date.now()
  });
};
