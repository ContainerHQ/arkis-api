var express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .post('/containers/:id/attach', (req, socket) => {
    docker
      .getContainer(req.params.id)
      .attach(req.query, handler.hijack(socket));
  })
  .post('/exec/:id/start', (req, socket) => {
    docker
      .getExec(req.params.id)
      .start(req.query, handler.hijack(socket));
  });

module.exports = router;
