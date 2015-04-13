var config = require('../../config'),
    docker = require('../../lib/docker');

const NOT_FOUND = '404 Not Found\r\n\r\n';

module.exports = function(req, socket, head) {
  // TODO: check route, write 404 if invalid. Close socket
  let proxy = new docker.Proxy(req, config.docker);
  
  proxy.hijack()
  .then(dockerSocket => {
    dockerSocket
      .pipe(socket)
      .pipe(dockerSocket);
  })
  .catch(err => socket.write(NOT_FOUND));
};
