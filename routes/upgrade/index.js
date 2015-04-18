var _ = require('lodash'),
    url = require('url'),
    pathToRegexp = require('path-to-regexp'),
    handler = require('../common/handler'),
    docker = require('../../config').docker;

// TODO: set http global agent
// Cleanup

module.exports = function(req, socket, head) {
  let request = url.parse(req.url, true);

  let keys = [];

  let reg = pathToRegexp('/:version/containers/:id/attach', keys);

  let res = reg.exec(request.pathname);

  let container = docker.getContainer(res[2]);

  container.attach(request.query, handler.hijack(socket));
};
