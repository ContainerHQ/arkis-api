var express = require('express'),
  docker = require('../../config').docker;

let router = express.Router();

router
  .get('/json', (req, res) => {
    docker.listImages(req.query, (err, data) => {
      res.send(data);
    });
  })
  .get('/search', (req, res) => {
    docker.searchImages(req.query, (err, data) => {
      res.send(data);
    });
  })
  .get('/get', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .post('/create', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .post('/load', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })

  .param('name', (req, res, next, name) => {
    req.image = docker.getImage(name);
    next();
  })
  .get('/:name/get', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .get('/:name/history', (req, res) => {
    req.image.history((err, data) => {
      res.send(data);
    });
  })
  .get('/:name/json', (req, res) => {
    req.image.inspect((err, data) => {
      res.send(data);
    });
  })
  .post('/:name/push', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .post('/:name/tag', (req, res) => {
    res.status(404).json('Not yet implemented.');
  })
  .delete('/:name', (req, res) => {
    req.image.remove(req.query, (err, data) => {
      res.send(data);
    });
  });


module.exports = router;
