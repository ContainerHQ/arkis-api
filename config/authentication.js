var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('../models').User;

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
      return done(null, false, { message: INCORRECT_PASSWORD });
    })
    .catch(done);
  }
));

module.exports = passport;
