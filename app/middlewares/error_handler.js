'use strict';

const INTERNAL_SERVER_ERROR = 'internal server error';

module.exports = function(err, req, res, next) {
  switch (err.name) {
    case 'SequelizeValidationError':
      res.status(400).send({ errors: err.errors });
      break;
    case 'UnauthorizedError':
      res.status(401).send();
      break;
    case 'ForbiddenError':
      res.status(403).send();
      break;
    default:
      console.error(err.message);
      res.status(500).send({ error: INTERNAL_SERVER_ERROR });
  }
  next();
};
