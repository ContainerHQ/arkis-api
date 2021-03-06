'use strict';

let _ = require('lodash'),
  sequelize = require('../models').sequelize,
  errors = require('../support').errors,
  ProviderManager = require('./provider_manager'),
  ClusterManager = require('./cluster_manager');

class AccountManager {
  constructor(user) {
    this.user     = user;
    this.provider = new ProviderManager(user);
  }
  register() {
    return sequelize.transaction(t => {
      let options = { transaction: t };

      return this.user.save(options).then(() => {
        return this.user.createProfile({}, options);
      }).then(() => {
        return this.provider.link(options);
      });
    });
  }
  destroy() {
    return sequelize.transaction(t => {
      let options = { transaction: t }, deletionErrors = [];

      return this.getClusterManagers(options).then(managers => {
        return Promise.all(_.map(managers, manager => {
          return manager.destroy().catch(err => {
            deletionErrors.push({
              name: err.name,
              message: err.message,
              resource: 'cluster',
              resource_id: manager.clusterId
            });
          });
        }));
      }).then(() => {
        if (!_.isEmpty(deletionErrors)) {
          return Promise.reject(new errors.DeletionError(deletionErrors));
        }
        return this.user.getProfile(options);
      }).then(profile => {
        return profile.destroy(options);
      }).then(() => {
        return this.provider.unlink(options);
      }).then(() => {
        return this.user.destroy(options);
      });
    });
  }
  getClusterManagers(options={}) {
    return this.user.getClusters(options).then(clusters => {
      return _.map(clusters, cluster => {
        return new ClusterManager(cluster);
      });
    });
  }
}

module.exports = AccountManager;
