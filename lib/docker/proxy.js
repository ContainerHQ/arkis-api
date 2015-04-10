var _ = require('underscore'),
  request = require('request'),
  Host = require('./host');

const JSON_CONTENT = {'content-type': 'application/json'};

class Proxy {
  constructor(req, host=Host.default()) {
    this.req  = req,
    this.opts = this._getOpts(host);
  }

  redirect() {
    let stream = request(this.opts);

    stream.on('error', err => console.error(err));

    if (this.req.isStreaming) {
      return this.req.pipe(stream);
    }
    return stream;
  }

  hijack() {
    return new Promise((resolve, reject) => {
      request(_.omit(this.opts, 'headers'))
      .on('socket', socket => resolve(socket))
      .on('error', err => reject(err));
    });
  }

  _getOpts(host) {
    let opts = {
      method: this.req.method,
      url: host.url + this.req.url,
      headers: _.omit(this.req.headers, 'host'),
      agentOptions: host.certs,
    };

    if (_.isMatch(this.req.headers, JSON_CONTENT)) {
      opts.json = this.req.body;
    }
    return opts;
  }
}

// TODO: implement a route matcher for hijack, we
// can reuse it with a middleware for attach without upgrade headers
// when calling attach with request, headers must be removed.

module.exports = Proxy;
