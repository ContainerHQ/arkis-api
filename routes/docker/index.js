var _ = require('underscore'),
    express = require('express'),
    es = require('event-stream'),
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

router.get('/version', function(req, res) {
    docker.redirect(req)
          .pipe(es.split())
          .pipe(es.parse())
          .pipe(es.map(function(data, cb) {
              data['ApiVersion'] += ' (Docker Proxy)';
              res.send(data);
          }));
});

module.exports = router;
