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
    return _.mapObject({ca: '', cert: '', key: ''}, function(val, key) {
        var filepath = path.resolve(process.env.DOCKER_CERT_PATH, key+'.pem');

        return fs.readFileSync(filepath);
    });
}

module.exports = Host;
