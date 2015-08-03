'use strict';

let moment = require('moment'),
  random = require('../support/random'),
  Node = require('../../app/models').Node;

module.exports = function(factory) {
  factory.define('node', Node, {
    name: random.string,
    region: 'london',
    node_size: 'deathstar'
  });

  factory.define('byonNode', Node, {
    name: random.string,
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
    last_state: 'running',
    last_ping: Date.now
  });

  factory.define('unreachableNode', Node, {
    name: random.string,
    region: 'london',
    node_size: 'deathstar',
    last_state: 'running',
    last_ping: moment().subtract(6, 'minutes')
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
    fqdn: 'forbidden.node.arkis.io',
    docker_version: '1.6.0',
    swarm_version: '0.3.0'
  });
};
