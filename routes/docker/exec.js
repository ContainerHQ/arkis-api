var express = require('express'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .param('id', (req, res, next, id) => {
    // Not available yet
    //req.exec = docker.getExec(id);
    next();
  })
  .get('/:id/json', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .post('/:id/start', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .post('/:id/resize', (req, res) => {
    res.status(404).json('Not yet implemented.');
  });
  
module.exports = router;