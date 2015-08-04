'use strict';

let models = require('../../app/models');

const ENTITIES_TO_DESTROY = ['User', 'Profile', 'Cluster', 'Node'],
      ALL = { where: {} };

/*
 * Generate a promise chain to delete database entities.
 */
module.exports.deleteAll = function(modelsName) {
  let promises = [];

  modelsName.forEach(modelName => {
    promises.push(models[modelName].destroy(ALL));
  });
  return Promise.all(promises);
};

/*
 * Setup database for testing.
 *
 * Sequelize.sync() is not using migrations. To ensure reproductibility
 * between environments, we are not using it and we must manually destroy
 * every database entries between each test.
 */
module.exports.sync = function() {
  beforeEach(() => {
    return this.deleteAll(ENTITIES_TO_DESTROY);
  });
};
