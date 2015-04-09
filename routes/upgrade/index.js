var docker = require('../../lib/docker');

var dockerHost = new docker.Host();

module.exports = function(req, socket, head) {
    // TODO: check route, write 404 if invalid. Close socket

    console.log(req.headers);
    var proxy = new docker.Proxy(req, dockerHost);

    proxy.hijack(socket);
}
