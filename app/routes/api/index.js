'use strict';

let express = require('express'),
  errorHandler = require('../../middlewares').errorHandler;

let router = express.Router();

router
.use('/v1', require('./v1'))
.use(errorHandler);

module.exports = router;
