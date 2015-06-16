'use strict';

let http = require('http'),
  Docker = require('dockerode');

http.globalAgent.maxSockets = 1000;

const CURRENT_DOCKER = new Docker();

module.exports = function(req, res, next) {
  req.docker = CURRENT_DOCKER;
  next();
};
