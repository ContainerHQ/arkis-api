'use strict';

var express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.use('/auth', require('./auth'))

.use(passport.authenticate('jwt', { session: false }))

.use('/account', require('./account'))
.use('/clusters', require('./clusters'))
.use('/node_sizes', require('./node_sizes'))
.use('/nodes', require('./nodes'))
.use('/regions', require('./regions'));

module.exports = router;
