'use strict';

var sequelize = require('sequelize');

let error = module.exports = {};

const MISMATCH_TYPE     = 'mismatchViolation',
      UNAUTHORIZED_USER = 'User unauthorized';

error.UnauthorizedError = class extends Error {
  constructor(message=UNAUTHORIZED_USER) {
    super(message);
    this.name = 'UnauthorizedError';
  }
};

error.MismatchError = class extends sequelize.ValidationError {
  constructor(key, value=null) {
    super();
    let message = `${key} doesn't match`;

    this.message = `${MISMATCH_TYPE}: ${message}`;
    this.errors = [{
      message: message,
      type: MISMATCH_TYPE,
      path: key,
      value: value
    }];
  }
};
