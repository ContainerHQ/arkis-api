var express = require('express'),
  passport = require('passport'),
  handler = require('../../common/handler'),
  User = require('../../../models').User;

let router = express.Router();

const CREATE_FILTER = { fields: ['email', 'password', 'token', 'token_id'] };

router
.post('/login', (req, res) => {
  let created = false;

  User.findOne({ where: { email: req.body.email } })
  .then(user => {
    created = user === null;
    return user || User.create(req.body, CREATE_FILTER);
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
.get('/github/callback', passport.authenticate('github', { session: false }),
  (req, res) => {
    console.log(req.headers);
});

module.exports = router;
