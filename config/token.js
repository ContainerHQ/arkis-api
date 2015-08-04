let jwt = require('jsonwebtoken'),
  secrets = require('./index').secrets;

module.exports.generate = function(jit) {
  return jwt.sign({ jit: jit }, secrets.jwt);
};
