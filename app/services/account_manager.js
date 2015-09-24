'use strict';

let _ = require('lodash'),
  errors = require('../support').errors,
  ClusterManager = require('./cluster_manager');

class AccountManager {
  constructor(user) {
    this.user = user;
  }
  destroy() {
    let deletionErrors = [];

    return this.getClusterManagers().then(managers => {
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
      return this.user.getProfile();
    }).then(profile => {
      return profile.destroy();
    }).then(() => {
      return this.user.destroy();
    });
  }
  getClusterManagers() {
    return this.user.getClusters().then(clusters => {
      return _.map(clusters, cluster => {
        return new ClusterManager(cluster);
      });
    });
  }
}

module.exports = AccountManager;
