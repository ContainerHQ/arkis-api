var _   = require('underscore'),
    fs  = require('fs'),
    path = require('path');

class Host{
    constructor() {
        this.tlsVerify = _.has(process.env, 'DOCKER_TLS_VERIFY');
        this.addr      = this._getAddr();
        this.certs     = this._getCerts();
    }
    /**
     * We are following the same format used by the Docker client:
     *  `tcp://[host][:port]` or `unix://path`
     * If there isn't a host available in env, fallback to:
     *  unix:///var/run/docker.sock
     * We are then parsing this host to request format: 
     *  `http://unix:/absolute/path/to/unix.socket:/request/path`
     */
    _getAddr() {
        var protocol = this.tlsVerify ? 'https' : 'http',
            host = process.env.DOCKER_HOST || 'unix:///var/run/docker.sock';
    
        if (host.indexOf('unix://') === 0) {
            host = 'unix:'+host.substring(7)+':';
        }
        else if (host.indexOf('tcp://') === 0) {
            host = host.substring(6);
        }
        return protocol+'://'+host;
    }
    _getCerts() {
        if (!this.tlsVerify) return;

        return _.mapObject({ca: '', cert: '', key: ''}, function(val, key) {
            var filepath = path.resolve(process.env.DOCKER_CERT_PATH, key+'.pem');
    
            return fs.readFileSync(filepath);
        });
    }
}

module.exports = Host;