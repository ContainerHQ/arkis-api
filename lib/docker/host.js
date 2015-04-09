var _       = require('underscore'),
    fs      = require('fs'),
    path    = require('path');

function Host() {
    this.tlsVerify = _.has(process.env, 'DOCKER_TLS_VERIFY');
    this.addr      = this._getAddr();
    this.certs     = this._getCerts();
}

Host.prototype._getAddr = function() {
    var protocol = this.tlsVerify ? 'https' : 'http';

    return process.env.DOCKER_HOST.replace('tcp', protocol);
}

Host.prototype._getCerts = function() {
    var certs = {};

    ['ca', 'cert', 'key'].forEach(function(name) {
        var filepath = path.resolve(process.env.DOCKER_CERT_PATH, name+'.pem');

        certs[name] = fs.readFileSync(filepath);
    });
    return certs;
}

module.exports = Host;
