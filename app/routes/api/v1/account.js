'use strict';

let _ = require('lodash'),
  express = require('express'),
  handler = require('../../shared/handler'),
  errors = require('../../shared/errors');

let router = express.Router();

const PROFILE_PARAMS = ['fullname', 'location', 'company'];

router
.get('/new_token', (req, res, next) => {
  req.user.revokeToken();
  req.user.generateToken();

  req.user.save().then(user => {
    res.json({ token: user.token });
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
  req.user.destroy().then(res.noContent).catch(next);
})
.get('/request_password', handler.notYetImplemented)

.route('/profile')
.get((req, res, next) => {
  req.user.getProfile().then(profile => {
    res.json({ profile: profile });
  })
  .catch(next);
})
.patch((req, res, next) => {
  req.user.getProfile().then(profile => {
    return profile.update(_.pick(req.body, PROFILE_PARAMS));
  })
  .then(profile => {
    res.json({ profile: profile });
  })
  .catch(next);
});

module.exports = router;
