var _ = require('lodash'),
  fs  = require('fs'),
  path = require('path'),
  docker = require('../lib/docker');

const HOST       = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
      TLS_VERIFY = !!process.env.DOCKER_TLS_VERIFY,
      CERTS      = loadCerts(process.env.DOCKER_CERT_PATH);

function loadCerts(dir) {
  if (!TLS_VERIFY) return {};

  return _.mapValues({ca:'', cert:'', key:''}, (value, cert) => {
    let filepath = path.resolve(dir, `${cert}.pem`);
  
    return fs.readFileSync(filepath);
  });
}

module.exports = new docker.Host(HOST, TLS_VERIFY, CERTS);