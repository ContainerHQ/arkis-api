'use strict';

var bcrypt = require('bcrypt');

module.exports = function(password) {
  return function(obj) {
    return bcrypt.compareSync(password, obj.password);
  };
};
