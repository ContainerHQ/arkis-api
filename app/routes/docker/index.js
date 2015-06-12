'use strict';

var express = require('express'),
  middlewares = require('../../middlewares');

let router = express.Router();

router
.use(middlewares.docker)
.use('/containers', require('./containers'))
.use('/images', require('./images'))
.use('/exec', require('./exec'))
.use('/', require('./root'));

module.exports = router;
