var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

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
function imageName(route) {
  return `/:name(([^\\\\]+\/?)+)${route}`;

}

router
  // check also x-registry-config
  //
  // We need to send a patch to docker-modem
  // and then an example to dockerode ?
  // Dockerode expect to have a auth object
  // and encode itself, but we already have
  // a base64 encoded string.
  .use((req, res, next) => {
    req.auth = req.headers['x-registry-auth'];
    next();
  })
  .get('/json', (req, res) => {
    docker.listImages(req.query, handler.sendTo(res));
  })
  .get('/search', (req, res) => {
    docker.searchImages(req.query, handler.sendTo(res));
  })
  .post('/create', (req, res) => {
    docker.createImage(req.auth, req.query, handler.streamTo(res));
  })
  .post('/load', (req, res) => {
    docker.loadImage(req, req.body, handler.sendTo(res));
  })
  .param('name', (req, res, next, name) => {
    req.image = docker.getImage(name);
    next();
  })
  .get(imageName('/get'), (req, res) => {
    req.image.get(handler.streamTo(res,
      'application/x-tar'
    ));
  })
  .get(imageName('/history'), (req, res) => {
    req.image.history(handler.sendTo(res));
  })
  .get(imageName('/json'), (req, res) => {
    req.image.inspect(handler.sendTo(res));
  })
  .post(imageName('/push'), (req, res) => {
    req.image.push(req.query, handler.streamTo(res), req.auth);
  })
  // This one and 6 others requires to respond
  // with 201 status.
  .post(imageName('/tag'), (req, res) => {
    req.image.tag(req.query, handler.sendTo(res));
  })

  // TODO: this route is broken
  .delete(imageName(), (req, res) => {
    req.image.remove(req.query, handler.sendTo(res));
  })

  /*
   * This one is not implemented by dockerode.
   * We need to send a patch ASAP.
   *
   */
  .get('/get', handler.notImplemented)

module.exports = router;
