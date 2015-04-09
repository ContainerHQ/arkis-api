var _ = require('underscore'),
    request = require('request');

function Proxy(req, host) {
    this.req  = req,
    this.host = host;
    this.opts = this._getOpts();
}

Proxy.prototype.redirect = function() {
    var stream = request(this.opts);

    stream.on('error', function(err) {
        console.error(err);
        // TODO: return a stream with an error
    });
    // a middleware will be better
    // to match proper routes
    if (this.streamRequest()) {
        return this.req.pipe(stream);
    }
    return stream;
}

// TODO: implement a route matcher for hijack, we
// can reuse it with a middleware for attach without upgrade headers
// when calling attach with request, headers must be removed.

Proxy.prototype.hijack = function(clientSocket) {
    request(_.omit(this.opts, 'headers'))
    .on('socket', function(serverSocket) {
        serverSocket.pipe(clientSocket).pipe(serverSocket);
    })
    .on('error', function(err) {
        clientSocket.write('404 Not Found\r\n\r\n');
    });
}

Proxy.prototype.streamRequest = function() {
    return this.req.method === 'POST' &&
        _.contains(['/build', '/images/load'], this.req.path);
}

Proxy.prototype._getOpts = function() {
    var opts = {
        method: this.req.method,
        url: this.host.addr + this.req.url,
        headers: _.omit(this.req.headers, 'host'),
        agentOptions: this.host.tlsVerify ? this.host.certs : {},
    };

    if (_.isMatch(this.req.headers, {'content-type': 'application/json'})) {
        opts.json = this.req.body;
    }
    return opts;
}

module.exports = Proxy;
