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
    cpu: 1,
    memory: 128,
    disk: 1.0,
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

  /*
   * Invalid ids are provided to ensure that they are blacklisted.
   */
  factory.define('forbiddenNode', Node, {
    id: 0,
    cluster_id: 0,
    name: random.string,
    region: 'test',
    node_size: 'whatever',
    public_ip: '192.168.212.42',
    last_state: 'upgrading',
    last_ping: Date.now,
    fqdn: 'forbidden.node.arkis.io'
  });
};
