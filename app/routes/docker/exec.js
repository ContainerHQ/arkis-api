'use strict';

let express = require('express');

let router = express.Router();

router
.param('id', (req, res, next, id) => {
  req.exec = req.docker.getExec(id);
  next();
})
.get('/:id/json', (req, res) => {
  req.exec.inspect(res.docker());
})
.post('/:id/start', (req, res) => {
  req.exec.start(req.body, res.docker({status: 200, stream: true}));
})
.post('/:id/resize', (req, res) => {
  req.exec.resize(req.body, res.docker({status: 201}));
});

module.exports = router;
