var express = require('express'),
    handler = require('../../common/handler');

let router = express.Router();

router
.get('/', handler.notYetImplemented)
.get('/:name', handler.notYetImplemented);

module.exports = router;
