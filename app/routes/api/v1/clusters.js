'use strict';

let express = require('express'),
  handler = require('../../shared/handler');

let router = express.Router();

router
.get('/', handler.notYetImplemented)
.post('/', handler.notYetImplemented)

.route('/:id')
.get(handler.notYetImplemented)
.delete(handler.notYetImplemented);

module.exports = router;
