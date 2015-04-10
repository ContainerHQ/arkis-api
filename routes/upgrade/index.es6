var docker = require('../../lib/docker');

module.exports = function(req, socket, head) {
  // TODO: check route, write 404 if invalid. Close socket
  let proxy = new docker.Proxy(req);

  proxy.hijack(socket);
};
