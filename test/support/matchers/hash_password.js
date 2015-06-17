'use strict';

let bcrypt = require('bcrypt');

module.exports = function(password) {
  return function(model) {
    return bcrypt.compareSync(password, model.password_hash);
  };
};
