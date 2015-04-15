var express = require('express'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .get('/json', (req, res) => {
    docker.listImages(req.query, handler.sendTo(res));
  })
  .get('/search', (req, res) => {
    docker.searchImages(req.query, handler.sendTo(res));
  })
  .get('/get', handler.notImplemented)
  .post('/create', (req, res) => {
    docker.pull('', req.query, handler.streamTo(res));
    
    // This should import if fromSrc is set instead of fromImage.
  })
  .post('/load', handler.notImplemented)

  .param('name', (req, res, next, name) => {
    req.image = docker.getImage(name);
    next();
  })
  .get('/:name/get', (req, res) => {
    req.image.get(req.query, handler.streamTo(res));
  })
  .get('/:name/history', (req, res) => {
    req.image.history(handler.sendTo(res));
  })
  .get('/:name/json', (req, res) => {
    req.image.inspect(handler.sendTo(res));
  })
  .post('/:name/push', handler.notImplemented)
  .post('/:name/tag', (req, res) => {
    req.image.tag(req.query, handler.sendTo(res));
  })
  .delete('/:name', (req, res) => {
    req.image.remove(req.query, handler.sendTo(res));
  });

module.exports = router;
