var express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

let router = express.Router();

/*
 * Waiting for https://github.com/apocas/dockerode/pull/131
 * to be merged upstream.
 *
 */

router
  .param('id', (req, res, next, id) => {
    // req.exec = docker.getExec(id);
    next();
  })
  .get('/:id/json', handler.notImplemented)

  // Status: 201
  .post('/:id/start', handler.notImplemented)

  // Status: 201
  .post('/:id/resize', handler.notImplemented);

module.exports = router;
