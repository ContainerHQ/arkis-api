'use strict';

let sequelize = require('sequelize');

let error = module.exports = {};

const MISMATCH_TYPE     = 'mismatchViolation',
      UNAUTHORIZED      = 'Unauthorized',
      FORBIDDEN         = 'Forbidden';

error.UnauthorizedError = class extends Error {
  constructor(message=UNAUTHORIZED) {
    super(message);
    this.name = 'UnauthorizedError';
  }
};

error.ForbiddenError = class extends Error {
  constructor(message=FORBIDDEN) {
    super(message);
    this.name = 'ForbiddenError';
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
