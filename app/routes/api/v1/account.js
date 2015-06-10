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
  if (!req.user.verifyPassword(req.body.current_password)) {
    return next(new errors.UnauthorizedError());
  }
  if (req.body.password !== req.body.password_confirmation) {
    return next(new errors.MismatchError('password_confirmation',
      req.body.password_confirmation
    ));
  }
  req.user.update({
    password: req.body.password
  }).then(() => {
    res.status(204).send();
  })
  .catch(next);
})
.patch('/change_email', (req, res, next) => {
  if (!req.user.verifyPassword(req.body.current_password)) {
    return next(new errors.UnauthorizedError());
  }
  req.user.update({
    email: req.body.email
  }).then(() => {
    res.status(204).send();
  })
  .catch(next);
})
.delete('/cancel', (req, res, next) => {
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
    return profile.update(req.body);
  })
  .then(profile => {
    res.status(200).send({ profile: profile });
  })
  .catch(next);
})
.get('/request_password', handler.notYetImplemented)

module.exports = router;
