'use strict';

let keygen = require('ssh-keygen'),
  uuid = require('node-uuid'),
  config = require('../../config');

const TEMP_PREFIX = '/tmp/ssh-';

class SSH {
  static generateKey() {
    return new Promise((resolve, reject) => {
      keygen({
        location: TEMP_PREFIX + uuid.v1(),
        comment:  config.domain,
        password: config.secrets.ssh,
        read: true,
        destroy: true
      }, (err, out) => {
        if (err) { return reject(err); }

        resolve({
          public:  out.pubKey.replace('\n', ''),
          private: out.key
        });
      });
    });
  }
}

module.exports = SSH;
