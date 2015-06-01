var express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.get('/profile', passport.authenticate('jwt', { session: false}),
  (req, res) => {
    res.send(req.user);
  }
)
.post('/login', passport.authenticate('local', { session: false }),
  (req, res) => {
    let status = req.user.created ? 201 : 200;

    res.status(status).send({ token: req.user.createToken() });
  }
);

module.exports = router;
