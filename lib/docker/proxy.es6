var _ = require('underscore'),
  request = require('request');

const NOT_FOUND    = '404 Not Found\r\n\r\n',
      JSON_CONTENT = {'content-type': 'application/json'};

class Proxy {
  constructor(req, host) {
    this.req  = req,
    this.host = host;
    this.opts = this._getOpts();
  }

  redirect() {
    let stream = request(this.opts);

    stream.on('error', err => {
      console.error(err);
    });
    // a middleware will be better
    // to match proper routes
    if (this.streamRequest()) {
        return this.req.pipe(stream);
    }
    return stream;
  }

  hijack(clientSocket) {
    request(_.omit(this.opts, 'headers'))
    .on('socket', serverSocket => {
        serverSocket.pipe(clientSocket).pipe(serverSocket);
    })
    .on('error', err => {
        clientSocket.write(NOT_FOUND);
    });
  }

  streamRequest() {
    return this.req.method === 'POST' &&
        _.contains(['/build', '/images/load'], this.req.path);
  }

  _getOpts() {
    let opts = {
        method: this.req.method,
        url: this.host.addr + this.req.url,
        headers: _.omit(this.req.headers, 'host'),
        agentOptions: this.host.tlsVerify ? this.host.certs : {},
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
