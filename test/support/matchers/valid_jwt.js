'use strict';

let jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');

/*
 * Verify that the decoded json web token includes an
 * unique identifier (jit) and that this identifier is
 * the same than the user token id.
 */
module.exports = function(user) {
  let payload = jwt.decode(user.token);

  return jwt.verify(user.token, secrets.jwt)
    && user.token_id === payload.jit
};
