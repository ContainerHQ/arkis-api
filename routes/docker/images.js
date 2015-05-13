var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler'),
  regexp  = require('../common/regexp');

let router = express.Router();

router
.use(['/create', regexp.imageName('/push')], (req, res, next) => {
  req.registryAuth = { key: req.headers['x-registry-auth'] };
  next();
})
.get('/json', (req, res) => {
  req.docker.listImages(req.query, handler.docker(res));
})
.get('/search', (req, res) => {
  req.docker.searchImages(req.query, handler.docker(res));
})
.post('/create', (req, res) => {
  req.docker.createImage(req.registryAuth, req.query, handler.docker(res, {stream: true}));
})
.post('/load', (req, res) => {
  req.docker.loadImage(req, req.body, handler.docker(res));
})

.param('name', (req, res, next, name) => {
  req.image = req.docker.getImage(name);
  next();
})
.get(regexp.imageName('/get'), (req, res) => {
  req.image.get(handler.docker(res,
    {stream: true, type: 'application/x-tar'}
  ));
})
.get(regexp.imageName('/history'), (req, res) => {
  req.image.history(handler.docker(res));
})
.get(regexp.imageName('/json'), (req, res) => {
  req.image.inspect(handler.docker(res));
})
.post(regexp.imageName('/push'), (req, res) => {
  req.image.push(req.query, handler.docker(res, {stream: true}), req.registryAuth);
})
.post(regexp.imageName('/tag'), (req, res) => {
  req.image.tag(req.query, handler.docker(res, {status: 201}));
})
.delete(regexp.imageName(), (req, res) => {
  req.image.remove(req.query, handler.docker(res));
})

.get('/get', handler.notYetImplemented);

module.exports = router;
