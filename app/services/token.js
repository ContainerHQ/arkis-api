let jwt = require('jsonwebtoken'),
  config = require('../../config');

module.exports.generate = function(jit) {
  return jwt.sign({ jit: jit }, config.secrets.jwt);
};

module.exports.verify = function(token, callback) {
  return jwt.verify(token, config.secrets.jwt, callback);
};
