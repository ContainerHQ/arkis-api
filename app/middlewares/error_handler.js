'use strict';

const INTERNAL_SERVER_ERROR = 'internal server error';

module.exports = function(err, req, res, next) {
  switch (err.name) {
    case 'SequelizeValidationError':
    case 'SequelizeUniqueConstraintError':
      res.status(400).json({ errors: err.errors });
      break;
    case 'PaginationError':
      res.status(400).json({ error: err.message });
      break;
    case 'StateError':
    case 'AlreadyUpgradedError':
      res.status(409).json({ error: err.message });
      break;
    case 'NotMasterError':
      res.status(403).json({ error: err.message  });
      break;
    case 'MachineCredentialsError':
      res.status(401).json({ error: err.message  });
      break;
    case 'MachineNotFoundError':
      res.status(404).json({ error: err.message  });
      break;
    case 'MachineUnprocessableError':
      res.status(422).json({ error: err.message  });
      break;
    default:
      console.error(err.message);
      res.status(500).json({ error: INTERNAL_SERVER_ERROR });
  }
  next();
};
