var express = require('express'),
  handler = require('../../shared/handler'),
  errors = require('../../shared/errors');

let router = express.Router();

router
.get('/new_token', (req, res, next) => {
  req.user.revokeToken();
  req.user.generateToken();

  req.user.save().then(user => {
    res.send({ token: user.token });
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
    password: req.body.new_password
  }).then(() => {
    res.status(204).send();
  })
  .catch(next);
})
.patch('/change_email', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return next(new errors.ForbiddenError());
  }
  req.user.update({
    email: req.body.new_email
  }).then(() => {
    res.status(204).send();
  })
  .catch(next);
})
.delete('/', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.password)) {
    return next(new errors.ForbiddenError());
  }
  req.user.destroy()
  .then(() => { res.status(204).send(); })
  .catch(next);
})
.get('/profile', (req, res, next) => {
  req.user.getProfile().then(profile => {
    res.send({ profile: profile });
  })
  .catch(next);
})
.patch('/profile', (req, res, next) => {
  req.user.getProfile().then(profile => {
    return profile.update(req.body,
      { fields: ['fullname', 'location', 'company'] }
    );
  })
  .then(profile => {
    res.status(200).send({ profile: profile });
  })
  .catch(next);
})
.get('/request_password', handler.notYetImplemented)

module.exports = router;
