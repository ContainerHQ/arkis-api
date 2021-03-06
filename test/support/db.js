/* globals factory: true */

'use strict';

let _ = require('lodash'),
  models = require('../../app/models');

const ENTITIES_TO_DESTROY = [
  'UserProviderLink', 'Profile', 'Action', 'Node', 'Cluster', 'User'
];

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

/*
 * Helper to fill the database with factories before each test for a context.
 */
module.exports.create = function(factoryNames) {
  beforeEach(() => {
    let promises = _(factoryNames).map(factoryName => {
      return _.map(new Array(5), () => {
        return factory.buildSync(factoryName).save();
      });
    }).flatten().value();

    return Promise.all(promises);
  });
};
