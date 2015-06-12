'use strict';

let models = require('../../app/models');

/*
 * Drop manually database entries before each test.
 *
 * Sequelize.sync() is not using migrations. To ensure reproducibility
 * between the different environment, we are not using it and we must
 * manually destroy every database entries between each test.
 *
 * User.findOne without parameters will retrieve the first user by default,
 * meaning that with only one user we can't be sure that our tests retrieve
 * the targeted user. Therefore we must ensure that we always a default user
 * in the database.
 *
 */

const ALL = { where: {} };

module.exports.sync = function(done) {
  beforeEach(done => {
    models.User.destroy(ALL)
    .then(() => {
      return models.Profile.destroy(ALL)
    })
    .then(() => {
      factory.create('defaultUser', done);
    }).catch(done);
  });
};
