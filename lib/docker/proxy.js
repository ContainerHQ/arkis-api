var _ = require('lodash'),
  request = require('request'),
  Host = require('./host');

const JSON_CONTENT = {'content-type': 'application/json'};

class Proxy {
  constructor(req, host) {
    this.req  = req;
    this.host = host;
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

  get opts() {
    return {
      method: this.req.method,
      url: this.host.url + this.req.url,
      headers: _.omit(this.req.headers, 'host'),
      agentOptions: this.host.certs,
      json: this.useJson ? this.req.body : null,
    };
  }
  
  get useJson() {
    return _.isMatch(this.req.headers, JSON_CONTENT);
  }
}

// TODO: implement a route matcher for hijack, we
// can reuse it with a middleware for attach without upgrade headers
// when calling attach with request, headers must be removed.

module.exports = Proxy;
