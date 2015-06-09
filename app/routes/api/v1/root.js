var express = require('express'),
  handler = require('../../common/handler');

let router = express.Router();

router
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
.patch('/new_token', (req, res) => {
  req.user.revokeToken();
  req.user.createToken();

  req.user.save().then(user => {
    res.status(200).send({ token: user.token });
  }).catch(err => {
    res.status(500).send({ errors: err.errors });
  });
})
.get('/request_password', handler.notYetImplemented)

module.exports = router;
