'use strict';

let express = require('express'),
  middlewares = require('../../middlewares');

let router = express.Router();

router
.use(middlewares.docker)
.post('/containers/:id/attach', (req, socket) => {
  req.docker
  .getContainer(req.params.id)
  .attach(req.query, socket.hijack());
})
.post('/exec/:id/start', (req, socket) => {
  req.docker
  .getExec(req.params.id)
  .start(req.query, socket.hijack());
});

module.exports = router;
