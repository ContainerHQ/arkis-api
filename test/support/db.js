'use strict';

var sequelize = require('../../app/models').sequelize;

/*
 * Drop database entries before each test.
 *
 * User.findOne without parameters will retrieve the first user by default,
 * meaning that with only one user we can't be sure that our tests retrieve
 * the targeted user. Therefore we must ensure that we always a default user
 * in the database.
 *
 */
module.exports.sync = function(done) {
  beforeEach(done => {
    sequelize.sync({force: true}).then(() => {
      factory.create('defaultUser', done);
    }).catch(done);
  });
};
