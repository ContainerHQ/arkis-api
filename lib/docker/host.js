var _ = require('lodash'),
  fs  = require('fs'),
  path = require('path');

const DEFAULT_DOCKER_HOST = 'unix:///var/run/docker.sock';

class Host {
  constructor(addr, tlsVerify=false, certPath='') {
    this.addr      = addr;
    this.tlsVerify = tlsVerify;
    this.certPath  = certPath;
  }
  /*
   * We are following the same format used by the Docker client:
   *  `tcp://[host][:port]` or `unix://path`
   * If there isn't a host available in env, fallback to:
   *  unix:///var/run/docker.sock
   */
  static default() {
    return new Host(
        process.env.DOCKER_HOST || DEFAULT_DOCKER_HOST,
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
  get url() {
    let protocol = this.tlsVerify ? 'https' : 'http';

    if (this.addr.startsWith('unix://')) {
      return `${protocol}://unix:${this.addr.substring(7)}:`;
    }
    if (this.addr.startsWith('tcp://')) {
      return `${protocol}://${this.addr.substring(6)}`;
    }
    return this.addr;
  }

  get certs() {
    if (!this.tlsVerify) return;

    return _.mapValues({ca:'', cert:'', key:''}, (value, cert) => {
      let filepath = path.resolve(this.certPath, `${cert}.pem`);

      return fs.readFileSync(filepath);
    });
  }
}

module.exports = Host;
