var _ = require('lodash'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  JwtStrategy = require('passport-jwt').Strategy,
  GitHubStrategy = require('passport-github2').Strategy,
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

        console.log(user.token);
        return done(null, user);
      }
      done(null, false, { message: INCORRECT_PASSWORD });
    })
    .catch(done);
  }
))
.use(new JwtStrategy({ secretOrKey: secrets.jwt }, (payload, done) => {
  User
  .findOne(payload)
  .then(user => {
    done(null, user);
  })
  .catch(done);
}));

/*
 * Add GitHub strategy only if application credentials are available.
 *
 */
if (!!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_SECRET_KEY) {
  passport
  .use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_SECRET_KEY
  },
  (accessToken, refreshToken, profile, done) => {
    User.findOrCreate({
      where: { email: profile.emails[0].value },
      defaults: {
        provider: profile.provider,
        provider_id: profile.id
      }
    })
    .spread((user, created) => {
      user.created = created;

      done(null, user);
    })
    .catch(done);
  }));
}

module.exports = passport;
