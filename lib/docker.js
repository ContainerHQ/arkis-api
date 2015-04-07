var fs      = require('fs'),
    path    = require('path'),
    request = require('request');

function DockerProxy() {
    this.host   = this._getHost();
    this.client = this._getClient();
}

DockerProxy.prototype.redirect = function(req) {
    var method = req.method.toLowerCase();

    // request method call for http delete
    // is called 'del' instead of delete.
    if (method === 'delete') method = 'del';

    var opts = { url: this.host+req.originalUrl };

    if (req.headers['content-type'] === 'application/json')
        opts['json'] = req.body;

    return req.pipe(this.client[method](opts));
}

DockerProxy.prototype.hijack = function(req, socket) {
    socket.write('101\r\n');

    var hijack = this.client.post(this.host+req.url);

    hijack.pipe(socket);

    socket.on('data', function(data) {
        hijack.write(data);
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
