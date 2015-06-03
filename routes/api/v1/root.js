var express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.get('/profile', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // Should send the profile
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
  (req, res) => {
    res.send(req.user);
  }
)
.patch('/change_password', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    if (!req.user.verifyPassword(req.body.old_password)) {
      return res.status(401).send();
    }
    if (req.body.password !== req.body.password_confirmation) {
      return res.status(400).send();
    }
    req.user.update({
      password: req.body.password
    })
    .then(user => {
      res.status(200).send();
    })
    .catch(err => {
      res.status(400).send(err.errors);
    });
    // { errors: err.errors } ?
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
  (req, res) => {
    let status = req.user.created ? 201 : 200;

    res.status(status).send({ token: req.user.token });
  }
);
// TODO: Avoid code duplication here !

module.exports = router;
