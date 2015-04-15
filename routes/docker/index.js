var express = require('express'),
  containers = require('./containers'),
  images = require('./images'),
  exec = require('./exec'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router();


router
  .use('/containers', containers)
  .use('/images', images)
  .use('/exec', exec)

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
      data.ApiVersion += ' (Docker Proxy)';
      return data;
    }));
  })
  .post('/auth', (req, res) => {
    docker.checkAuth(req.body, handler.sendTo(res));
  })
  .post('/build', (req, res) => {
    docker.buildImage(req, req.body, handler.streamTo(res));
  })
  .post('/commit', handler.notImplemented);

module.exports = router;
