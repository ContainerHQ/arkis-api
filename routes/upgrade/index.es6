var docker = require('../../lib/docker');

let dockerHost = new docker.Host.default();

module.exports = function(req, socket, head) {
    // TODO: check route, write 404 if invalid. Close socket

    let proxy = new docker.Proxy(req, dockerHost);

    proxy.hijack(socket);
};
