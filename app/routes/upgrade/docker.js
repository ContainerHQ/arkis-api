var express = require('express'),
  handler = require('../common/handler'),
  middlewares = require('../../middlewares');

let router = express.Router();

router
.use(middlewares.docker)
.post('/containers/:id/attach', (req, socket) => {
  req.docker
  .getContainer(req.params.id)
  .attach(req.query, handler.hijack(socket));
})
.post('/exec/:id/start', (req, socket) => {
  req.docker
  .getExec(req.params.id)
  .start(req.query, handler.hijack(socket));
});

module.exports = router;
