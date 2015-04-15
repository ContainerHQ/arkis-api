var express = require('express'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .get('/json', (req, res) => {
    docker.listImages(req.query, (err, data) => {
      res.send(data);
    });
  })
  .get('/search', (req, res) => {
    docker.searchImages(req.query, (err, data) => {
      res.send(data);
    });
  })
  .get('/get', handler.notImplemented)
  .post('/create', handler.notImplemented)
  .post('/load', handler.notImplemented)

  .param('name', (req, res, next, name) => {
    req.image = docker.getImage(name);
    next();
  })
  .get('/:name/get', handler.notImplemented)
  .get('/:name/history', (req, res) => {
    req.image.history((err, data) => {
      res.send(data);
    });
  })
  .get('/:name/json', (req, res) => {
    req.image.inspect((err, data) => {
      res.send(data);
    });
  })
  .post('/:name/push', handler.notImplemented)
  .post('/:name/tag', handler.notImplemented)
  .delete('/:name', (req, res) => {
    req.image.remove(req.query, (err, data) => {
      res.send(data);
    });
  });


module.exports = router;
