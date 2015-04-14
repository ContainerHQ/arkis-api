var _ = require('lodash'),
    url = require('url'),
    pathToRegexp = require('path-to-regexp'),
    docker = require('../../config').docker;

const NOT_FOUND = '404 Not Found\r\n\r\n';

// TODO: set http global agent
// Cleanup

module.exports = function(req, socket, head) {
  let request = url.parse(req.url, true);

  let keys = [];

  let reg = pathToRegexp('/:version/containers/:id/attach', keys);

  let res = reg.exec(request.pathname);


  let container = docker.getContainer(res[2]);

  container.attach(request.query, (err, stream) => {
    if (err) return socket.write(NOT_FOUND);

    socket.write('101\r\n');

    socket.pipe(stream).pipe(socket);
  });
};
