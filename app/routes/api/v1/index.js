'use strict';

let express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.use('/auth', require('./auth'))
.use('/agent', require('./agent'))

.use(passport.authenticate('jwt', { session: false }))
/*
 * This below requires to have an authorization header with a valid JWT.
 */
.use('/account', require('./account'))
.use('/clusters', require('./clusters'))
.use('/nodesizes', require('./nodesizes'))
.use('/regions', require('./regions'));

module.exports = router;
