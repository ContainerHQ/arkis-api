var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler');

let router = express.Router();

router
.get('/github', passport.authenticate('github'))
.get('/github/callback', passport.authenticate('github'),
  handler.notYetImplemented
);

module.exports = router;
