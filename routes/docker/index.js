var express = require('express'),
  containers = require('./containers'),
  images = require('./images'),
  docker = require('../../config').docker;

let router = express.Router();

function jsonHandler(res, cb) {
  return function (err, data) {
    if (typeof cb === 'function')
      data = cb(data);
    res.send(data);
  };
}

router
  .use('/containers', containers)
  .use('/images', images)
  .get('/_ping', (req, res) => {
    docker.ping((err, data) => {
      res.send(data);
    });
  })
  .get('/events', (req, res) => {
    docker.getEvents(req.query, (err, data) => {
      res.contentType('application/json');

      data.pipe(res);
    });
  })
  .get('/info', (req, res) => {
    docker.info((err, data) => {
      res.send(data);
    });
  })
  .get('/version', (req, res) => {
    docker.version(jsonHandler(res, (data) => {
      data.ApiVersion += ' (Docker Proxy)';
      return data;
    }));
  })
  .post('/auth', (req, res) => {
    docker.checkAuth(req.body, (err, data) => {
      res.send(data);
    });
  })
  .post('/build', (req, res) => {
    docker.buildImage(req, req.body, (err, data) => {
      res.contentType('application/json');

      data.pipe(res);
    });
  });

module.exports = router;
