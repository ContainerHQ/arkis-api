'use strict';

var jwt = require('jsonwebtoken'),
  secrets = require('../../../config/secrets');

module.exports = function(obj) {
  let token = !!obj.body ? obj.body.token : obj.token;

  return jwt.verify(token, secrets.jwt);
};
