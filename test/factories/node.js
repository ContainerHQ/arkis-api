'use strict';

let Node = require('../../app/models').Node,
  random = require('../support/random');

module.exports = function(factory) {
  factory.define('node', Node, {
    name: random.string,
    region: 'london',
    node_size: 'deathstar'
  });

  factory.define('byonNode', Node, {
    name: 'byon',
    byon: true,
  });

  factory.define('registeredNode', Node, {
    name: random.string,
    master: true,
    region: 'london',
    node_size: 'deathstar',
    public_ip: '192.168.212.128',
  });

  factory.define('runningNode', Node, {
    name: random.string,
    region: 'london',
    node_size: 'deathstar',
    public_ip: '192.168.212.128',
    last_state: 'running',
    last_ping: Date.now
  });

  factory.define('forbiddenNode', Node, {
    name: random.string,
    region: 'test',
    node_size: 'whatever',
    public_ip: '192.168.212.42',
    last_state: 'upgrading',
    last_ping: Date.now,
    fqdn: 'forbidden.node.arkis.io'
  });
};
