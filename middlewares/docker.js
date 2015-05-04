var http = require('http'),
  Docker = require('dockerode');

http.globalAgent.maxSockets = 1000;

let docker = new Docker();

module.exports = function(req, res, next) {
  req.docker = docker;
  next();
};
