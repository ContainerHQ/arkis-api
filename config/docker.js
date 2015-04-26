var http = require('http'),
    Docker = require('dockerode');

http.globalAgent.maxSockets = 1000;

module.exports = new Docker();
