var passport = require('passport'),
  JwtStrategy = require('passport-jwt').Strategy,
  GitHubStrategy = require('passport-github2').Strategy,
  User = require('../models').User,
  secrets = require('../../config/secrets');

passport
.use(new JwtStrategy({ secretOrKey: secrets.jwt }, (payload, done) => {
  User
  .findOne(payload)
  .then(user => {
    if (payload.jit !== user.token_id) {
      return done(null, false);
    }
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
    let user = User.build({ email: 'azerty@gmail.com', password: 'decembre99' });
    console.log('uiij');
    done(null, user);
  }));
}

module.exports = passport;
