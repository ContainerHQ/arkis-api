var express = require('express'),
  handler = require('../shared/handler');

let router = express.Router();

router
.param('id', (req, res, next, id) => {
  req.exec = req.docker.getExec(id);
  next();
})
.get('/:id/json', (req, res) => {
  req.exec.inspect(handler.docker(res));
})
.post('/:id/start', (req, res) => {
  req.exec.start(req.body, handler.docker(res, {status: 200, stream: true}));
})
.post('/:id/resize', (req, res) => {
  req.exec.resize(req.body, handler.docker(res, {status: 201}));
});

module.exports = router;
