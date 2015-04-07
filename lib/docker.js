var fs      = require('fs'),
    path    = require('path'),
    request = require('request');

function DockerProxy() {
    this.host   = this._getHost();
    this.client = this._getClient();
}

DockerProxy.prototype.redirect = function(req) {
    var url = this.host + req.originalUrl,
        method = req.method.toLowerCase();

    // request method call for http delete
    // is called 'del' instead of delete.
    if (method === 'delete') method = 'del';

    return this.client[method]({url: url, json: req.body});
}

DockerProxy.prototype.hijack = function(req, socket) {
    req.originalUrl = req.url;

    socket.write('101\r\n');

    var stream = this.redirect(req);

    stream.pipe(socket);

    socket.on('data', function(data) {
        stream.write(data);
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

    return request.defaults({
        agentOptions: this._loadCerts()
    });
}

DockerProxy.prototype._loadCerts = function() {
    var certs = {};

    ['ca', 'cert', 'key'].forEach(function(name) {
        var filepath = path.resolve(process.env.DOCKER_CERT_PATH, name+'.pem');

        certs[name] = fs.readFileSync(filepath);
    });
    return certs;
}

module.exports = DockerProxy;
