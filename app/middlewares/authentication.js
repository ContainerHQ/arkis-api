'use strict';

var passport = require('passport'),
  JwtStrategy = require('passport-jwt').Strategy,
  GitHubStrategy = require('passport-github2').Strategy,
  User = require('../models').User,
  secrets = require('../../config/secrets');

passport
.use(new JwtStrategy({ secretOrKey: secrets.jwt }, (payload, done) => {
  User
  .findOne({ where: { token_id: payload.jit } })
  .then(user => {
    done(null, user);
  })
  .catch(done);
}))
.use(new GitHubStrategy({
  /*
   * If not set, use fake credentials in order to avoid errors.
   */
  clientID: process.env.GITHUB_CLIENT_ID || '*',
  clientSecret: process.env.GITHUB_SECRET_KEY || '*'
}, (accessToken, refreshToken, profile, done) => {
/*  let user = User.build({ email: 'azerty@gmail.com', password: 'decembre99' });*/

  //let defaults = {
    //provider: 'github',
    //provider_id: profile.id,
    //email: profile.emails[0].value
  /*};*/
  // update profile with infos (fullname etc)
  // whitelist parameters on creation (user)
  done(null, false);
}));

module.exports = passport;
