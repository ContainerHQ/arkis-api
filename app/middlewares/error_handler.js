'use strict';

const INTERNAL_SERVER_ERROR = 'internal server error';

module.exports = function(err, req, res, next) {
  switch (err.name) {
    case 'UnauthorizedError':
      res.status(401).send();
      break;
    case 'SequelizeValidationError':
      res.status(400).send({ errors: err.errors });
      break;
    default:
      console.error(err.message);
      res.status(500).send({ error: INTERNAL_SERVER_ERROR });
  }
  next();
};
