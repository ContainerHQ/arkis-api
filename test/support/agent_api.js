'use strict';

module.exports.createFakeServer = function(request) {
  let server = require('superagent-mocker')(request);

  server.post('/update', () => {
    return {};
  });
  return server;
};
