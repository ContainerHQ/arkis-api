'use strict';

var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');

/*
 * Verify that the decoded json web token includes the
 * user email address and the user token id and that the
 * token is verified with the secret key.
 *
 */
module.exports = function(user) {
  let payload = jwt.decode(user.token);

  return jwt.verify(user.token, secrets.jwt)
    && user.email === payload.email
    && user.token_id === payload.jit
};
