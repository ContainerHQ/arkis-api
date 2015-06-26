'use strict';

let _ = require('lodash'),
  express = require('express'),
  handler = require('../shared/handler'),
  version = require('../../../package.json').version;

let router = express.Router();

router
.get('/_ping', (req, res) => {
  req.docker.ping(res.docker());
})
.get('/events', (req, res) => {
  req.docker.getEvents(req.query, res.docker({stream: true}));
})
.get('/info', (req, res) => {
  req.docker.info(handler.docker(res));
})
.get('/version', (req, res) => {
  req.docker.version(res.docker(data => {
    data.ApiVersion += ` (Docker Proxy ${version})`;
  }));
})
.post('/auth', (req, res) => {
  req.docker.checkAuth(req.body, res.docker());
})
.post('/build', (req, res) => {
  let opts = _.merge(req.query, req.body);

  req.docker.buildImage(req, opts, res.docker({stream: true}));
})
.post('/commit', (req, res) => {
  req.docker
  .getContainer(req.query.container)
  .commit(req.query, res.docker({status: 201}));
});

module.exports = router;
