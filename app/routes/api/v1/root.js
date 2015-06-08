var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler'),
  User = require('../../../models').User,
  Profile = require('../../../models').Profile;

let router = express.Router();

router
.post('/login', (req, res) => {
  let created = false;

  User.findOne({ email: req.body.email })
  .then(user => {
    created = user === null;
    return user || User.create(req.body, { fields: ['email', 'password'] });
  })
  .then(user => {
    if (!created && !user.verifyPassword(req.body.password)) {
      return res.status(401).send();
    }

    let statusCode = created ? 201 : 200;

    res.status(statusCode).send({ token: user.token });
  })
  .catch(err => {
    res.status(400).json({ errors: err.errors });
  });
})

.use(passport.authenticate('jwt', { session: false }))

.patch('/change_password', (req, res) => {
  if (!req.user.verifyPassword(req.body.current_password)) {
    return res.status(401).send();
  }
  if (req.body.new_password !== req.body.password_confirmation) {
    return res.status(400).send({
      errors: [{
        message: "password confirmation doesn't match password",
        type: 'mismatch Violation',
        path: 'password_confirmation',
        value: req.body.password_confirmation
      }]
    });
  }
  req.user.update({
    password: req.body.new_password
  })
  .then(() => {
    res.status(204).send();
  })
  .catch(err => {
    res.status(400).json({ errors: err.errors });
  });
})
.delete('/cancel_account', (req, res) => {
  req.user.destroy()
  .then(()  => { res.status(204).send(); })
  .catch(() => { res.status(500).send(); });
})
.get('/profile', (req, res) => {
  req.user.getProfile().then(profile => {
    res.status(200).send({ profile: profile });
  })
  .catch(err => {
    res.status(500).send({ errors: err.errors });
  });
})
.patch('/profile', (req, res) => {
  req.user.getProfile().then(profile => {
    return profile.update(req.body);
  })
  .then(profile => {
    res.status(204).send();
  })
  .catch(err => {
    res.status(400).send({ errors: err.errors });
  });
})
.post('/new_token', handler.notYetImplemented)
.get('/request_password', handler.notYetImplemented)

module.exports = router;
