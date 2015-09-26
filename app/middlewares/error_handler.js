'use strict';

let _ = require('lodash');

const INTERNAL_SERVER_ERROR = {
  name: 'internal_server_error',
  message: `There was a server error while processing your request.
  Try again later, or contact support.`
};

const HTTP_CODES = {
  'SequelizeValidationError':  400,
  'PaginationError':           400,
  'AlreadyUpgradedError':      409,
  'DeletionError':             409,
  'NotMasterError':            403,
  'MachineCredentialsError':   401,
  'MachineNotFoundError':      404,
  'StateError':                422,
  'MachineUnprocessableError': 422
};

/*
 * Format error types/name to snake case and removes sequelize indications.
 */
function serializeError(error) {
  return _.mapValues(error, (value, key) => {
    switch (key) {
      case 'name':
        return _.snakeCase(value.replace('Sequelize', ''));
      case 'errors':
        return _.map(value, err => {
          err.name = _.snakeCase(err.name || err.type);
          delete err.type;
          return err;
        });
      default:
        return value;
    }
  });
}

module.exports = function(err, req, res, next) {
  let statusCode = HTTP_CODES[err.name] || 500,
      body;

  if (statusCode === 500) {
    console.error(err);

    body = INTERNAL_SERVER_ERROR;
  } else {
    body = serializeError(err);
  }
  res.status(statusCode).json(body);
  next();
};
