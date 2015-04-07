var _ = require('underscore'),
    express = require('express'),
    api = require('./api'),
    DockerProxy = require('../../lib/docker');

var docker = new DockerProxy();

function proxyRequest(req, res) {
    docker.redirect(req).pipe(res);
}

var router = express.Router();

_.each(api, function(routes, method) {
    _.each(routes, function(route) {
        router[method](route, proxyRequest);
    });
});

module.exports = router;
