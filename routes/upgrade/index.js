var DockerProxy = require('../../lib/docker');

var docker = new DockerProxy();

module.exports = function(req, socket, head) {
    docker.hijack(req, socket);
}
