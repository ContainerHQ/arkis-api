var express = require('express'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router();

const NAME_GROUP = '(([^\\\\]+\/?)+)';

router
  .get('/json', (req, res) => {
    docker.listImages(req.query, handler.sendTo(res));
  })
  .get('/search', (req, res) => {
    docker.searchImages(req.query, handler.sendTo(res));
  })
  .post('/create', (req, res) => {
    docker.pull('', req.query, handler.streamTo(res));
    
    // This should import if fromSrc is set instead of fromImage.
  })
  
  // Id should be parsed in the same way in containers (for the redirection)
  .param('name', (req, res, next, name) => {
    console.log(name);
    req.image = docker.getImage(name);
    next();
  })
  .get('/:name/get', (req, res) => {
    req.image.get(req.query, handler.streamTo(res));
  })
  .get('/:name'+NAME_GROUP+'/history', (req, res) => {
    req.image.history(handler.sendTo(res));
  })
  .get('/:name/json', (req, res) => {
    req.image.inspect(handler.sendTo(res));
  })
  .post('/:name/push', (req, res) => {
    req.image.push(req.query, handler.streamTo(res));
  })
  .post('/:name/tag', (req, res) => {
    req.image.tag(req.query, handler.sendTo(res));
  })
  .delete('/:name', (req, res) => {
    req.image.remove(req.query, handler.sendTo(res));
  })

  /*
   *
   * Not yet Implemented
   *
   */
  .get('/get', handler.notImplemented)
  .post('/load', handler.notImplemented);

module.exports = router;
