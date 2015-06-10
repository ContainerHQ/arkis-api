'use strict';

var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');

/*
 * Verify that the decoded json web token includes the
 * user id  and the user token id and that the token is
 * verified with the secret key.
 *
 */
module.exports = function(user) {
  let payload = jwt.decode(user.token);

  console.log(payload);
  return jwt.verify(user.token, secrets.jwt)
    && user.id === payload.user_id
    && user.token_id === payload.jit
};
