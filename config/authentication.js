var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('../models').User;

const INVALID_PASSWORD = 'Invalid password.';

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
        return done(null, user);
      }
      return done(new Error(INVALID_PASSWORD));
    });
  }
));

module.exports = passport;
