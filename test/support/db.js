'use strict';

let models = require('../../app/models');

const ENTITIES_TO_DESTROY = ['Profile', 'Action', 'Node', 'Cluster', 'User'];

/*
 * Generate a promise chain to delete database entities.
 */
module.exports.deleteAll = function(modelsName) {
  return Promise.all(modelsName.map(modelName => {
    return models[modelName].destroy({ where: {} });
  }));
};

module.exports.deleteAllAndRetry = function(modelsName) {
  return this.deleteAll(modelsName).catch(() => {
    return this.deleteAllAndRetry(modelsName);
  });
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
    return this.deleteAllAndRetry(ENTITIES_TO_DESTROY);
  });
};
