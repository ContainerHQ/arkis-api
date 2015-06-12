'use strict';

var _ = require('lodash'),
  express = require('express'),
  handler = require('../shared/handler'),
  version = require('../../../package.json').version;

let router = express.Router();

router
.get('/_ping', (req, res) => {
  req.docker.ping(handler.docker(res));
})
.get('/events', (req, res) => {
  req.docker.getEvents(req.query, handler.docker(res, {stream: true}));
})
.get('/info', (req, res) => {
  req.docker.info(handler.docker(res));
})
.get('/version', (req, res) => {
  req.docker.version(handler.docker(res, (data) => {
    data.ApiVersion += ` (Docker Proxy ${version})`;
  }));
})
.post('/auth', (req, res) => {
  req.docker.checkAuth(req.body, handler.docker(res));
})
.post('/build', (req, res) => {
  let opts = _.merge(req.query, req.body);

  req.docker.buildImage(req, opts, handler.docker(res, {stream: true}));
})
.post('/commit', (req, res) => {
  req.docker
  .getContainer(req.query.container)
  .commit(req.query, handler.docker(res, {status: 201}));
});

module.exports = router;
