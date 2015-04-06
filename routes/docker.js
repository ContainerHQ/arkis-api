var _ = require('underscore'),
    express = require('express'),
    DockerProxy = require('../lib/docker');

var docker = new DockerProxy();

var router = express.Router();

var api = {
    get: [
        '/_ping',
        '/events',
        '/info',
        '/version',
        '/images/json',
        '/images/viz',
        '/images/search',
        '/images/get',
        '/images/:id/get',
        '/images/:id/history',
        '/images/:id/json',
        '/containers/ps',
        '/containers/json',
        '/containers/:id/export',
        '/containers/:id/changes',
        '/containers/:id/json',
        '/containers/:id/top',
        '/containers/:id/logs',
        '/containers/:id/stats',
        //'/containers/:id/attach/ws',
        '/exec/:execid/json',
    ],
    post: [
        '/auth',
        '/commit',
      //  '/build',
        '/images/create',
     //   '/images/load',
      //  '/images/:id/push',
        '/images/:id/tag',
        '/containers/create',
        '/containers/:id/kill',
        '/containers/:id/pause',
        '/containers/:id/unpause',
        '/containers/:id/rename',
        '/containers/:id/restart',
     //   '/containers/:id/start',
        '/containers/:id/stop',
        '/containers/:id/wait',
        '/containers/:id/resize',
        '/containers/:id/copy',
        '/containers/:id/exec',
        '/exec/:id/start',
        '/exec/:id/resize',
    ],
    delete: [
        '/containers/:id',
        '/images/:id',
    ],
};

function proxy(req, res) {
    docker.redirect(req).pipe(res);
}

_.map(api, function(routes, method) {
    _.each(routes, function(route) {
        router[method](route, proxy);
    });
});

module.exports = router;
