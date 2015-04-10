var fs  = require('fs'),
  path = require('path');

class Host {
  constructor(addr, tlsVerify=false, certPath='') {
    this.tlsVerify = tlsVerify;
    this.url       = this._getUrl(addr);
    this.certs     = this._getCerts(certPath);
  }
  /*
   * We are following the same format used by the Docker client:
   *  `tcp://[host][:port]` or `unix://path`
   * If there isn't a host available in env, fallback to:
   *  unix:///var/run/docker.sock
   */
  static default() {
    return new Host(
        process.env.DOCKER_HOST || 'unix:///var/run/docker.sock',
        !!process.env.DOCKER_TLS_VERIFY,
        process.env.DOCKER_CERT_PATH
    );
  }
  /*
   * We are parsing this host to request format:
   *  `http://unix:/absolute/path/to/unix.socket:/request/path`
   * Or:
   *  `http://host/request/path`
   */
  _getUrl(host) {
    let protocol = this.tlsVerify ? 'https' : 'http';

    if (host.startsWith('unix://')) {
      return `${protocol}://unix:${host.substring(7)}:`;
    }
    if (host.startsWith('tcp://')) {
      return `${protocol}://${host.substring(6)}`;
    }
    return host;
  }

  _getCerts(certPath) {
    if (!this.tlsVerify) return;

    let certs = {};

    for (let cert of ['ca', 'cert', 'key']) {
      let filepath = path.resolve(certPath, `${cert}.pem`);

      certs[cert] = fs.readFileSync(filepath);
    }
    return certs;
  }
}

module.exports = Host;
