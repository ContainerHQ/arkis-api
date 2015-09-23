'use strict';

let _ = require('lodash');

const INTERNAL_SERVER_ERROR = {
  name: 'internal_server_error',
  message: `There was a server error while processing your request.
  Try again later, or contact support.`
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
  let statusCode;

  switch (err.name) {
    case 'SequelizeValidationError':
      statusCode = 400;
      break;
    case 'PaginationError':
      statusCode = 400;
      break;
    case 'AlreadyUpgradedError':
    case 'DeletionError':
      statusCode = 409;
      break;
    case 'NotMasterError':
      statusCode = 403;
      break;
    case 'MachineCredentialsError':
      statusCode = 401;
      break;
    case 'MachineNotFoundError':
      statusCode = 404;
      break;
    case 'StateError':
    case 'MachineUnprocessableError':
      statusCode = 422;
      break;
    default:
      console.error(err);
      res.status(500).json(INTERNAL_SERVER_ERROR);
      return next();
  }
  res.status(statusCode).json(serializeError(err));
  next();
};
