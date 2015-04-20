var url = require('url'),
  express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .use((req, res, next) => {
    req.query = url.parse(req.url, true).query;
    next();
  })
  .post('/:version?/containers/:id/attach', (req, socket) => {
    let container = docker.getContainer(req.params.id);

    container.attach(req.query, handler.hijack(socket));
  })
  .post('/:version?/exec/:id/start', (req, socket) => {
    let exec = docker.getExec(req.params.id);

    exec.start(req.query, handler.hijack(socket));
  });

module.exports = router;
