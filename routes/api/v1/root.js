var express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.get('/profile', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.send(req.user);
  }
)
.post('/profile', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.send(req.user);
  }
)
.get('/request_password', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.send(req.user);
  }
)
.post('/change_password', passport.authenticate('jwt', { session: false }),
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
      res.send(user);
    })
    .catch(err => {
      res.status(400).send(err.errors);
    });
  }
)
.post('/login', passport.authenticate('local', { session: false }),
  (req, res) => {
    let status = req.user.created ? 201 : 200;

    res.status(status).send({ token: req.user.createToken() });
  }
);

module.exports = router;
