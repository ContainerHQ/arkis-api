var DockerProxy = require('../../lib/docker');

var docker = new DockerProxy();

module.exports = function(req, socket, head) {
    // TODO: check route, write 404 if invalid. Close socket
    docker.hijack(req, socket);
}
