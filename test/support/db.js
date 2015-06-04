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
