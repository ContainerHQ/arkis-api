'use strict';

let passport = require('passport'),
  JwtStrategy = require('passport-jwt').Strategy,
  GitHubStrategy = require('passport-github2').Strategy,
  User = require('../models').User,
  config = require('../../config');

passport
.use(new JwtStrategy({ secretOrKey: config.secrets.jwt }, (payload, done) => {
  User
  .findOne({ where: { token_id: payload.jit } })
  .then(user => {
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
}));

module.exports = passport;
