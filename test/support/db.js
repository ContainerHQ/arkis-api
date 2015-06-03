'use strict';

var models = require('../../models'),
  sequelize = models.sequelize,
  User = models.User;

/*
 * Drop database entries before each test.
 *
 */
module.exports.sync = function() {
  beforeEach(() => {
    return sequelize.sync({force: true});
  });
};

/*
 * Create a user before each test.
 * Returns a function to get this user.
 *
 */
module.exports.createUser = function(attributes) {
  let user;

  beforeEach(() => {
    user = User.build(attributes);
    return user.save();
  });

  return function() {
    return user;
  };
};
