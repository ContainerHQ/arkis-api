var url = require('url'),
  express = require('express');

let router = express.Router();

router
.use((req, res, next) => {
  req.query = url.parse(req.url, true).query;
  next();
})
.use('/:version?', require('./docker'));

module.exports = router;
