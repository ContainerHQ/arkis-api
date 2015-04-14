var express = require('express'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .get('/json', (req, res) => {
    docker.listImages(req.query, (err, data) => {
      console.log(err);
      res.send(data);
    });
  });

module.exports = router;
