'use strict';

var express = require('express'),
  middlewares = require('../../middlewares'),
  docker = require('./docker');

let router = express.Router();

router
.use(middlewares.parseQuery)
.use('/', docker)
.use('/v:version', docker);

module.exports = router;
