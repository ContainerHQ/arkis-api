'use strict';

class Cert {
  static generate() {
    return Promise.resolve({
      ca: 'ca',
      server: {
        cert: 'server-cert',
        key:  'server-key'
      },
      client: {
        cert: 'client-cert',
        key:  'client-key'
      }
    });
  }
}

module.exports = Cert;
