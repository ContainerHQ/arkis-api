'use strict';

let moment = require('moment'),
  random = require('../random'),
  Node = require('../../../app/models').Node;

module.exports = function(factory) {
  factory.define('node', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar'
  });

  factory.define('byonNode', Node, {
    name: random.string,
    byon: true,
  });

  factory.define('registeredNode', Node, {
    name: random.string,
    master: false,
    region: 'london',
    size: 'deathstar',
    last_state: 'running',
    last_seen: Date.now,
    cpu: 1,
    memory: 128,
    disk: 1.0,
    public_ip: random.ip,
    provider_id: random.string,
    labels: {
      environment: 'production',
      storage: 'ssd',
      tags: ['small']
    }
  });

  factory.define('deployingNode', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar'
  });

  factory.define('upgradingNode', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar',
    last_state: 'upgrading'
  });

  factory.define('updatingNode', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar',
    last_state: 'updating'
  });

  factory.define('runningNode', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar',
    last_state: 'running',
    last_seen: moment
  });

  factory.define('unreachableNode', Node, {
    name: random.string,
    region: 'london',
    size: 'deathstar',
    last_state: 'running',
    last_seen: moment().subtract(6, 'minutes')
  });

  /*
   * Invalid ids are provided to ensure that they are blacklisted.
   */
  factory.define('forbiddenNode', Node, {
    id: 0,
    cluster_id: 0,
    name: random.string,
    master: true,
    region: 'test',
    size: 'whatever',
    public_ip: random.ip,
    last_state: 'running',
    last_seen: moment().subtract(3, 'minutes'),
    cpu: 2,
    memory: 256,
    disk: 2.0,
    labels: {
      storage: 'floppy',
      environment: 'staging'
    },
    docker_version: '1.6.0',
    swarm_version: '0.3.0',
    provider_id: 1,
    deployed_at: moment()
  });
};
