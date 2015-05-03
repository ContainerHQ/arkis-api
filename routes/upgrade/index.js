var url = require('url'),
  express = require('express'),
  middlewares = require('../../middlewares');

let router = express.Router();

router
.use(middlewares.parseQuery)
.use('/:version?', require('./docker'));

module.exports = router;
