var express = require('express'),
    handler = require('../../common/handler');


let router = express.Router();

router
.get('/', handler.notYetImplemented)
.get('/:id', handler.notYetImplemented)
.post('/', handler.notYetImplemented)
.delete('/:id', handler.notYetImplemented);

module.exports = router;
