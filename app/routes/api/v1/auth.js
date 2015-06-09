var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler'),
  User = require('../../../models').User;

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

.get('/github', passport.authenticate('github'))
.get('/github/callback', passport.authenticate('github'),
  handler.notYetImplemented
);

module.exports = router;
