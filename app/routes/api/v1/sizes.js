'use strict';

let express = require('express'),
  RegionSizeManager = require('../../../services').RegionSizeManager;

let router = express.Router();

router
.get('/', (err, res, next) => {
  let manager = new RegionSizeManager();

  manager.getSizes().then(sizes => {
    res.serialize({ sizes: sizes });
  }).catch(next);
});

module.exports = router;
