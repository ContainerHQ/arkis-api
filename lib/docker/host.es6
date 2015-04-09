var fs  = require('fs'),
    path = require('path');

class Host{
  constructor(host, tlsVerify, certPath) {
    this.tlsVerify = tlsVerify;
    this.addr      = this._getAddr(host);
    this.certs     = this._getCerts(certPath);
  }
   /**
   * We are following the same format used by the Docker client:
   *  `tcp://[host][:port]` or `unix://path`
   * If there isn't a host available in env, fallback to:
   *  unix:///var/run/docker.sock
   * We are then parsing this host to request format:
   *  `http://unix:/absolute/path/to/unix.socket:/request/path`
   */
  static default() {
    return new Host(
        process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
        !!process.env.DOCKER_TLS_VERIFY,
        process.env.DOCKER_CERT_PATH
    );
  }

  _getAddr(host) {
    let protocol = this.tlsVerify ? 'https' : 'http';

    if (host.startsWith('unix://')) {
      host = `unix:${host.substring(7)}:`;
    }
    else if (host.startsWith('tcp://')) {
      host = host.substring(6);
    }
    return `${protocol}://${host}`;
  }

  _getCerts(certPath) {
    if (!this.tlsVerify) return;

    let certs = {};

    ['ca', 'cert', 'key'].forEach(cert => {
      let filepath = path.resolve(certPath, `${cert}.pem`);

      certs[cert] = fs.readFileSync(filepath);
    });
    return certs;
  }
}

module.exports = Host;
