var express = require('express'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router();

/*
 * Waiting for https://github.com/apocas/dockerode/pull/131
 * to be merged upstream.
 *
 */

router
  .param('id', (req, res, next, id) => {
    next();
  })
  .get('/:id/json', handler.notImplemented)
  .post('/:id/start', handler.notImplemented)
  .post('/:id/resize', handler.notImplemented);
  
module.exports = router;