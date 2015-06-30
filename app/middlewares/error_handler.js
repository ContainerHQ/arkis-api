'use strict';

const INTERNAL_SERVER_ERROR = 'internal server error';

module.exports = function(err, req, res, next) {
  switch (err.name) {
    case 'SequelizeValidationError':
      res.status(400).json({ errors: err.errors });
      break;
    case 'PaginationError':
      res.status(400).json({ error: err.message });
      break;
    default:
      console.error(err.message);
      res.status(500).json({ error: INTERNAL_SERVER_ERROR });
  }
  next();
};
