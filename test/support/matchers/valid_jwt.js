'use strict';

let jwt = require('jsonwebtoken'),
  secrets = require('../../../config').secrets;

/*
 * Verify that the decoded json web token includes an
 * unique identifier (jit) and that this identifier is
 * the same than the user token id.
 */
module.exports = function(model) {
  let payload = jwt.decode(model.token);

  return jwt.verify(model.token, secrets.jwt) &&
    (payload.jit === model.token_id || payload.jit === model.id);
};
