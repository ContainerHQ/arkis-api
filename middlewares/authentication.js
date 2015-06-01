var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  JwtStrategy = require('passport-jwt').Strategy,
  User = require('../models').User,
  secrets = require('../config/secrets');

const INCORRECT_PASSWORD = 'Incorrect password.';

passport
.use(new LocalStrategy({
    usernameField: 'email'
  },
  (email, password, done) => {
    User
    .findOrCreate({
      where: { email: email },
      defaults: { password: password }
    })
    .spread((user, created) => {
      if (created || user.verifyPassword(password)) {
        user.created = created;

        return done(null, user);
      }
      done(null, false, { message: INCORRECT_PASSWORD });
    })
    .catch(done);
  }
))
.use(new JwtStrategy({ secretOrKey: secrets.jwt }, function(payload, done) {
  User
  .findOne(payload)
  .then(user => {
    done(null, user);
  })
  .catch(done);
}));

module.exports = passport;
