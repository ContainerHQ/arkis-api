let jwt = require('jsonwebtoken'),
  secrets = require('./secrets');

module.exports.generate = function(jit) {
  return jwt.sign({ jit: jit }, secrets.jwt);
};
