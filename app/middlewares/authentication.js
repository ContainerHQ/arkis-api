'use strict';

let passport = require('passport'),
  JwtStrategy = require('passport-jwt').Strategy,
  GitHubStrategy = require('passport-github2').Strategy,
  config = require('../../config'),
  User = require('../models').User;

passport
.use(new JwtStrategy({ secretOrKey: config.secrets.jwt }, (payload, done) => {
  User
  .findOne({ where: { token_id: payload.jit } })
  .then(user => {
    /*
     * If user doesn't exist, this strategy returns a 401 unauthorized anyway.
     */
    done(null, user);
  }).catch(done);
}))
.use(new GitHubStrategy(config.auth.github,
  (accessToken, refreshToken, profile, done) => {
/*  let user = User.build({ email: 'azerty@gmail.com', password: 'decembre99' });*/

  //let defaults = {
    //provider: 'github',
    //provider_id: profile.id,
    //email: _.first(profile.emails).value
  /*};*/
  // update profile with infos (fullname etc)
  // whitelist parameters on creation (user)
  done(null, false);

  // TODO: Add validations on provider_id uniqueness per provider!
}));

module.exports = passport;
