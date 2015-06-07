'use strict';

var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');
/*
 * Verify that the decoded json web token includes the
 * user email and that the token is verified with the
 * secret key.
 *
 */
module.exports = function(model) {
  let payload = jwt.decode(model.token);

  return model.email === payload.email
    && jwt.verify(model.token, secrets.jwt);
};
