var express = require('express'),
    docker = require('../../config/docker');

let router = express.Router();

router
.use((req, res, next) => {
  // Create a middleware for that
  req.docker = docker;
  next();
})
.use('/containers', require('./containers'))
.use('/images', require('./images'))
.use('/exec', require('./exec'))
.use('/', require('./root'))

module.exports = router;
