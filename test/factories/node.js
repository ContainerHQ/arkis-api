'use strict';

let Node = require('../../app/models').Node;

module.exports = function(factory) {
  factory.define('node', Node, {
    name: 'battlestar.apps'
  });

  factory.define('registeredNode', Node, {
    name: 'registered',
    master: true,
    fqdn: 'http://registered.node.arkis.io',
    public_ip: '192.168.212.128',
    last_state: 'running'
  });
};
