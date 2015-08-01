'use strict';

let _ = require('lodash'),
  errors = require('../routes/shared/errors');

module.exports = function(req, res, next) {
  req.pagination = {
    limit:  parseInt(req.query.limit  || 25),
    offset: parseInt(req.query.offset || 0),
    group:  ['id']
  };

  ['limit', 'offset'].forEach(attribute => {
    let value = req.pagination[attribute];

    if (value < 0) {
      throw new errors.PaginationError(attribute, value);
    }
  });

  res.paginate = function(entity) {
    return function(result) {
      let data = {
        meta: _(req.pagination)
          .pick(['limit', 'offset'])
          .merge({ total_count: result.count.length })
      };
      data[entity] = result.rows;

      res.json(data);
    };
  };
  next();
};
