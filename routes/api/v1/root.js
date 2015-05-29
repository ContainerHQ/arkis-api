var express = require('express'),
  passport = require('passport');

let router = express.Router();

router
.post('/login', passport.authenticate('local', { session: false }),
  (req, res) => {
    let status = req.user.hasBeenCreated() ? 201 : 200;

    res.status(status).send({ email: req.user.email });
  }
);

module.exports = router;
