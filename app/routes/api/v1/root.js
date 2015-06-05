var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler'),
  User = require('../../../models').User;

let router = express.Router();

router
.post('/login', (req, res) => {
  User
  .findOrCreate({
    where: { email: req.body.email },
    defaults: { password: req.body.password }
  })
  .spread((user, created) => {
    if (created || user.verifyPassword(req.body.password)) {
      let status = created ? 201 : 200;

      return res.status(status).send({ token: user.token });
    }
    return res.status(401).send();
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
    res.status(200).send();
  })
  .catch(err => {
    res.status(400).json({ errors: err.errors });
  });
})
.get('/request_password', handler.notYetImplemented)
.delete('/cancel_account', (req, res) => {
  req.user.destroy()
  .then(()  => { res.status(200).send(); })
  .catch(() => { res.status(500).send(); });
})
.get('/profile', (req, res) => {
  res.send(req.user);
})
.post('/profile', (req, res) => {
  res.status(200).send();
})

module.exports = router;
