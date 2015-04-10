var _ = require('underscore'),
  express = require('express'),
  es = require('event-stream'),
  api = require('./api'),
  docker = require('../../lib/docker');

let dockerHost = new docker.Host.default(),
    router = express.Router();

router.use((req, res, next) => {
  req.proxy = new docker.Proxy(req, dockerHost);
  next();
});

for (let method of Object.keys(api)) {
  for (let route of api[method]) {
    router[method](route, (req, res) => {
      req.proxy.redirect().pipe(res);
    });
  }
}

router.get('/version', (req, res) => {
  req.proxy.redirect()
    .pipe(es.split())
    .pipe(es.parse())
    .pipe(es.map((data, cb) => {
      data.ApiVersion += ' (Docker Proxy)';
      res.send(data);
    }));
});

module.exports = router;
