'use strict';

let Cert = require('../../app/models').Cert;

module.exports = function(factory) {
  factory.define('cert', Cert, {
    server_cert: 'server_cert',
    server_key: 'server_key',
    server_ca: 'server_ca',
    client_cert: 'client_cert',
    client_key: 'client_key',
    client_ca: 'client_ca',
  });
};
