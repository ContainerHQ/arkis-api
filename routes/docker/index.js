var _ = require('underscore'),
    express = require('express'),
    es = require('event-stream'),
    api = require('./api'),
    docker = require('../../lib/docker');

var dockerHost = new docker.Host();

function proxyRequest(req, res) {
    var proxy = new docker.Proxy(req, dockerHost);

    proxy.redirect().pipe(res);
}

var router = express.Router();

_.each(api, function(routes, method) {
    _.each(routes, function(route) {
        router[method](route, proxyRequest);
    });
});

router.get('/version', function(req, res) {
    var proxy = new docker.Proxy(req, dockerHost);

    proxy.redirect()
          .pipe(es.split())
          .pipe(es.parse())
          .pipe(es.map(function(data, cb) {
              data['ApiVersion'] += ' (Docker Proxy)';
              res.send(data);
          }));
});

module.exports = router;
