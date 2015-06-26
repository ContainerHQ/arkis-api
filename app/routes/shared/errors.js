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
