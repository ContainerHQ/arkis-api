var express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .param('id', (req, res, next, id) => {
    req.exec = docker.getExec(id);
    next();
  })
  .get('/:id/json', (req, res) => {
    req.exec.inspect(handler.sendTo(res));
  })
  .post('/:id/start', (req, res) => {
    console.log('start');
    req.exec.start(req.body, handler.sendTo(res, () => {
      res.status(201);
    }));
  })
  .post('/:id/resize', (req, res) => {
    req.exec.start(req.body, handler.sendTo(res, () => {
      res.status(201);
    }));
  });

module.exports = router;
