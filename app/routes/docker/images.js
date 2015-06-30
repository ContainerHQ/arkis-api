'use strict';

let express = require('express'),
  handler = require('../shared/handler'),
  regexp  = require('../shared/regexp');

let router = express.Router();

router
.use(['/create', regexp.imageName('/push')], (req, res, next) => {
  req.registryAuth = { key: req.headers['x-registry-auth'] };
  next();
})
.get('/json', (req, res) => {
  req.docker.listImages(req.query, res.docker());
})
.get('/search', (req, res) => {
  req.docker.searchImages(req.query, res.docker());
})
.post('/create', (req, res) => {
  req.docker.createImage(req.registryAuth, req.query, res.docker({stream: true}));
})
.post('/load', (req, res) => {
  req.docker.loadImage(req, req.body, res.docker());
})

.param('name', (req, res, next, name) => {
  req.image = req.docker.getImage(name);
  next();
})
.get(regexp.imageName('/get'), (req, res) => {
  req.image.get(res.docker(
    {stream: true, type: 'application/x-tar'}
  ));
})
.get(regexp.imageName('/history'), (req, res) => {
  req.image.history(res.docker());
})
.get(regexp.imageName('/json'), (req, res) => {
  req.image.inspect(res.docker());
})
.post(regexp.imageName('/push'), (req, res) => {
  req.image.push(req.query, res.docker({stream: true}), req.registryAuth);
})
.post(regexp.imageName('/tag'), (req, res) => {
  req.image.tag(req.query, res.docker({status: 201}));
})
.delete(regexp.imageName(), (req, res) => {
  req.image.remove(req.query, res.docker());
})

.get('/get', handler.notYetImplemented);

module.exports = router;
