var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler');

let router = express.Router();

router
.get('/profile', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.send(req.user);
  }
)
.post('/profile', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.status(200).send();
  }
)
.delete('/cancel_account', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    req.user.destroy()
    .then(()  => { res.status(200).send(); })
    .catch(() => { res.status(500).send(); });
  }
)

.get('/request_password', passport.authenticate('jwt', { session: false }),
  handler.notYetImplemented
)
.patch('/change_password', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    if (!req.user.verifyPassword(req.body.current_password)) {
      return res.status(401).send();
    }
    if (req.body.new_password !== req.body.new_password_confirmation) {
      return res.status(400).send({
        errors: [{
          message: "password confirmation doesn't match password",
          type: 'mismatch Violation',
          path: 'password_confirmation',
          value: null
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
  }
)
.post('/login', passport.authenticate('local', { session: false }),
  (req, res) => {
    let status = req.user.created ? 201 : 200;

    res.status(status).send({ token: req.user.token });
  }
)
.get('/auth/github', passport.authenticate('github'))
.get('/auth/github/callback', passport.authenticate('github'),
  handler.notYetImplemented
);

module.exports = router;
