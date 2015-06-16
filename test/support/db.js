'use strict';

let models = require('../../app/models');

const ENTITIES_TO_DESTROY = ['User', 'Profile'];

/*
 * Generate a promise chain to delete database entities.
 *
 */
module.exports.deleteAll = function(modelsName) {
  let actions;

  modelsName.forEach(modelName => {
    let action = models[modelName].destroy({ where: {} });

    actions = action || action.then(() => {
      return action;
    });
  });
  return actions;
}

/*
 * Setup database for testing.
 *
 * Sequelize.sync() is not using migrations. To ensure reproductibility
 * between environments, we are not using it and we must manually destroy
 * every database entries between each test.
 *
 * User.findOne without parameters will retrieve the first user by default,
 * meaning that with only one user we can't be sure that our tests retrieve
 * the targeted user. Therefore we must ensure that we always a default user
 * in the database.
 *
 */
module.exports.sync = function(done) {
  beforeEach(done => {
    this.deleteAll(ENTITIES_TO_DESTROY).then(() => {
      factory.create('defaultUser', done);
    }).catch(done);
  });
};
