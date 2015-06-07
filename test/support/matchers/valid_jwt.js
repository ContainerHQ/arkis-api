'use strict';

var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');
/*
 * Verify that the decoded json web token includes the
 * user email address and that the token is verified with
 * the secret key.
 *
 */
module.exports = function(user) {
  let payload = jwt.decode(user.token);

  return user.email === payload.email
    && jwt.verify(user.token, secrets.jwt);
};
