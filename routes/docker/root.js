var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker,
  version = require('../../package.json').version;

let router = express.Router();

router
  .get('/_ping', (req, res) => {
    docker.ping(handler.sendTo(res));
  })
  .get('/events', (req, res) => {
    docker.getEvents(req.query, handler.streamTo(res));
  })
  .get('/info', (req, res) => {
    docker.info(handler.sendTo(res));
  })
  .get('/version', (req, res) => {
    docker.version(handler.sendTo(res, (data) => {
      data.ApiVersion += ` (Docker Proxy ${version})`;
    }));
  })
  .post('/auth', (req, res) => {
    docker.checkAuth(req.body, handler.sendTo(res));
  })
  .post('/build', (req, res) => {
    docker.buildImage(req, req.body, handler.streamTo(res));
  })
  .post('/commit', (req, res) => {
    let container = docker.getContainer(req.query.container);

    container.commit(req.query, handler.sendTo(res, data => {
      res.status(201);
    }));
  });

module.exports = router;
