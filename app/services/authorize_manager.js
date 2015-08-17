'use strict';

let _ = require('lodash'),
  errors = require('../support').errors;

const CONFLICTED_STATE = 'running',
      VERSIONS = ['docker_version', 'swarm_version'];

class AuthorizeManager {
  constructor(instance, compare) {
    this.instance = instance;
    this.compare  = compare;
  }

  get isConflicted() {
    return this.instance.state !== CONFLICTED_STATE;
  }
  conflict(action) {
    return Promise.reject(new errors.StateError(action, this.instance.state));
  }
  get isAlreadyUpgraded() {
    let instanceVersions = _.pick(this.instance,   VERSIONS),
      compareVersions    = _.pick(this.compare,    VERSIONS);

    return _.isEqual(instanceVersions, compareVersions);
  }
  alreadyUpgraded() {
    return Promise.reject(new errors.AlreadyUpgradedError());
  }
}

module.exports = AuthorizeManager;
