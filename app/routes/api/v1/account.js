'use strict';

let express = require('express'),
  handler = require('../../shared/handler'),
  services = require('../../../services'),
  errors = require('../../../support').errors;

let router = express.Router();

router
.get('/new_token', (req, res, next) => {
  req.user.revokeToken();
  req.user.generateToken();

  req.user.save().then(user => {
    res.serialize({ token: user.token });
  }).catch(next);
})
.patch('/change_password', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.old_password)) {
    return res.forbidden();
  }
  if (req.body.new_password !== req.body.new_password_confirmation) {
    return next(new errors.MismatchError('password_confirmation',
      req.body.new_password_confirmation
    ));
  }
  req.user.update({
    password: req.body.new_password,
  }).then(res.noContent).catch(next);
})
.patch('/change_email', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return res.forbidden();
  }
  req.user.update({
    email: req.body.new_email
  }).then(res.noContent).catch(next);
})
.delete('/', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return res.forbidden();
  }
  let account = new services.AccountManager(req.user);

  account.destroy().then(res.noContent).catch(next);
})
.get('/request_password', handler.notYetImplemented)

.use('/profile', require('./profile'));

module.exports = router;
