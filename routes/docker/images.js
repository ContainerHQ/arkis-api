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
.get(imageName('/get'), (req, res) => {
  req.image.get(handler.docker(res,
    {stream: true, type: 'application/x-tar'}
  ));
})
.get(imageName('/history'), (req, res) => {
  req.image.history(handler.docker(res));
})
.get(imageName('/json'), (req, res) => {
  req.image.inspect(handler.docker(res));
})
.post(imageName('/push'), (req, res) => {
  req.image.push(req.query, handler.docker(res, {stream: true}), req.registryAuth);
})
.post(imageName('/tag'), (req, res) => {
  req.image.tag(req.query, handler.docker(res, {status: 201}));
})
.delete(imageName(), (req, res) => {
  req.image.remove(req.query, handler.docker(res));
})

.get('/get', handler.notYetImplemented);

module.exports = router;
