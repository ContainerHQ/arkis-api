'use strict';

let random = require('../random'),
  cert = {};

cert.generate = function() {
  return Promise.resolve({
    client: {
      cert: random.string(), key: random.string(), ca: random.string()
    },
    server: {
      cert: random.string(), key: random.string(), ca: random.string()
    }
  });
};

module.exports = cert;
