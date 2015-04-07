var fs      = require('fs'),
    path    = require('path'),
    request = require('request');

function DockerProxy() {
    this.host   = this._getHost();
    this.client = this._getClient();
}

DockerProxy.prototype.redirect = function(req) {
    var opts = {
        method: req.method,
        url: this.host+req.originalUrl,
    };

    if (req.headers['content-type'] === 'application/json') {
        opts.json = req.body;
    }
    var stream = this.client(opts);

    stream.on('error', function(err) {
        console.error(err);
    });

    if (req.headers['transfer-encoding'] === 'chunked') {
        return req.pipe(stream);
    }
    return stream;
}

DockerProxy.prototype.hijack = function(req, clientSocket) {
    this.client({
        method: req.method,
        url: this.host+req.url
    })
    .on('socket', function(dockerSocket) {
        dockerSocket.pipe(clientSocket).pipe(dockerSocket);
    });
}

DockerProxy.prototype.tlsVerify = function() {
    return !!process.env.DOCKER_TLS_VERIFY;
}

DockerProxy.prototype._getHost = function() {
    var protocol = this.tlsVerify() ? 'https' : 'http';

    return process.env.DOCKER_HOST.replace('tcp', protocol);
}

DockerProxy.prototype._getClient = function() {
    if (!this.tlsVerify) return request;

    return request.defaults({ agentOptions: this._getCerts() });
}

DockerProxy.prototype._getCerts = function() {
    var certs = {};

    ['ca', 'cert', 'key'].forEach(function(name) {
        var filepath = path.resolve(process.env.DOCKER_CERT_PATH, name+'.pem');

        certs[name] = fs.readFileSync(filepath);
    });
    return certs;
}

module.exports = DockerProxy;
