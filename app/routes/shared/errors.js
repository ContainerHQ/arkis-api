'use strict';

let sequelize = require('sequelize');

let error = module.exports = {};

const MISMATCH_TYPE = 'mismatchViolation';

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

const PAGINATION_MSG = 'Please provide a positive integer >= 0.';

error.PaginationError = class extends Error {
  constructor(attribute, value) {
    super();

    this.name = 'PaginationError';
    this.message = `Invalid ${attribute} '${value}' provided. ${PAGINATION_MSG}`;
  }
};

error.StateError = class extends Error {
  constructor(action, state) {
    super();

    this.name = 'StateError';
    this.message = `Can't perform ${action} in ${state} state.`;
  }
};
