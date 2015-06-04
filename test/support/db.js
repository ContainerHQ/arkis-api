'use strict';

var sequelize = require('../../app/models').sequelize;

/*
 * Drop database entries before each test.
 *
 */
module.exports.sync = function() {
  beforeEach(() => {
    return sequelize.sync({force: true});
  });
};
