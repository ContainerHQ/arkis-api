'use strict';

let express = require('express'),
  handler = require('../../shared/handler'),
  errors = require('../../shared/errors');

let router = express.Router();

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
    return next(new errors.ForbiddenError());
  }
  if (req.body.new_password !== req.body.new_password_confirmation) {
    return next(new errors.MismatchError('password_confirmation',
      req.body.new_password_confirmation
    ));
  }
  req.user.update({
    password: req.body.new_password,
  }).then(handler.sendNoContent(res)).catch(next);
})
.patch('/change_email', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return next(new errors.ForbiddenError());
  }
  req.user.update({
    email: req.body.new_email
  }).then(handler.sendNoContent(res)).catch(next);
})
.delete('/', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return next(new errors.ForbiddenError());
  }
  req.user.destroy().then(handler.sendNoContent(res)).catch(next);
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
    return profile.update(req.body,
      { fields: ['fullname', 'location', 'company'] }
    );
  })
  .then(profile => {
    res.json({ profile: profile });
  })
  .catch(next);
});

module.exports = router;
