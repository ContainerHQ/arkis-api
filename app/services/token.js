let jwt = require('jsonwebtoken'),
  config = require('../../config');

module.exports.generate = function(jit) {
  return jwt.sign({ jit: jit }, config.secrets.jwt);
};
