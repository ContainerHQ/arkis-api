class Host {
  constructor(addr, tlsVerify=false, certs={}) {
    this.addr      = addr;
    this.tlsVerify = tlsVerify;
    this.certs     = certs;
  }
  /*
   * We are following the same format used by the Docker client:
   *  `tcp://[host][:port]` or `unix://path`
   *
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
}

module.exports = Host;
