var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler');

let router = express.Router();

/*
 *
 *  Returns a route formated with a RegExp to be able
 *  to get paths like:
 *
 *    /images/foliea/ubuntu/json
 *    /images/ubuntu/json
 *    /images/
 *
 *  with routes parameters like:
 *
 *    /images/:name/json
 *
 *  Allowing the targeted identifier to be either:
 *
 *    foliea/ubuntu
 *    ubuntu
 *    fhiu89hui
 *    grounds.io/foliea/ubuntu
 *
 */
function imageName(route='') {
  return `/:name(([^\\\\]+\/?)+)${route}`;
}

router
.use(['/create', imageName('/push')], (req, res, next) => {
  req.registryAuth = { key: req.headers['x-registry-auth'] };
  next();
})
.get('/json', (req, res) => {
  req.docker.listImages(req.query, handler.sendTo(res));
})
.get('/search', (req, res) => {
  req.docker.searchImages(req.query, handler.sendTo(res));
})
.post('/create', (req, res) => {
  req.docker.createImage(req.registryAuth, req.query, handler.streamTo(res));
})
.post('/load', (req, res) => {
  req.docker.loadImage(req, req.body, handler.sendTo(res));
})
.param('name', (req, res, next, name) => {
  req.image = docker.getImage(name);
  next();
})
.get(imageName('/get'), (req, res) => {
  req.image.get(handler.streamTo(res, 'application/x-tar'));
})
.get(imageName('/history'), (req, res) => {
  req.image.history(handler.sendTo(res));
})
.get(imageName('/json'), (req, res) => {
  req.image.inspect(handler.sendTo(res));
})
.post(imageName('/push'), (req, res) => {
  req.image.push(req.query, handler.streamTo(res), req.registryAuth);
})
.post(imageName('/tag'), (req, res) => {
  req.image.tag(req.query, handler.sendTo(res, () => {
    res.status(201);
  }));
})
.delete(imageName(), (req, res) => {
  req.image.remove(req.query, handler.sendTo(res));
})

.get('/get', handler.notImplemented);

module.exports = router;