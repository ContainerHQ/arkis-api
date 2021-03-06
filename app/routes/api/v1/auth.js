'use strict';

let _ = require('lodash'),
  express = require('express'),
  passport = require('passport'),
  services = require('../../../services'),
  User = require('../../../models').User;


let router = express.Router();

const USER_PARAMS = ['email', 'password'];

router
.post('/login', (req, res, next) => {
  let created, newUser;

  User.findOne({ where: { email: req.body.email } }).then(user => {
    created = user === null;
    return user || User.build(_.pick(req.body, USER_PARAMS));
  }).then(user => {
    if (user.isNewRecord) {
      newUser = user;
      return new services.AccountManager(user).register();
    }
    return user;
  }).then(user => {
    if (!created && !user.verifyPassword(req.body.password)) {
      return res.unauthorized();
    }
    let statusCode = created ? 201 : 200;

    res.status(statusCode).serialize({ token: (newUser || user).token });
  }).catch(next);
})

.get('/github', passport.authenticate('github'))
.get('/github/callback', passport.authenticate('github', { session: false }),
  (req, res) => {
    res.status(204).send();
});

module.exports = router;
