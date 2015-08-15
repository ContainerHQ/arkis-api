'use strict';

const CONFLICTED_STATE = 'running';

let errors = require('../routes/shared/errors');

class AuthorizeManager {
  constructor(instance) {
    this.instance = instance;
  }

  get isConflicted() {
    return this.instance.state !== CONFLICTED_STATE;
  }
  conflict(action) {
    return Promise.reject(new errors.StateError(action, this.instance.state));
  }
}

module.exports = AuthorizeManager;
