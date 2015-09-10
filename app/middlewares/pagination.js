'use strict';

let _ = require('lodash'),
  errors = require('../support').errors;

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0;

module.exports = function(req, res, next) {
  req.pagination = {
    limit:  parseInt(req.query.limit  || DEFAULT_LIMIT),
    offset: parseInt(req.query.offset || DEFAULT_OFFSET),
    group:  ['id']
  };

  let { limit, offset } = req.pagination;

  if (offset < 0) {
    throw new errors.PaginationError({ attribute: 'offset', value: offset,
      range: { start: 0 }
    });
  }
  if (!_.inRange(limit, 0, DEFAULT_LIMIT + 1)) {
    throw new errors.PaginationError({ attribute: 'limit', value: limit,
      range: { start: 0, end: DEFAULT_LIMIT }
    });
  }

  res.paginate = function(entity) {
    return function(result) {
      let data = {
        meta: _(req.pagination)
          .pick(['limit', 'offset'])
          .merge({ total_count: result.count.length })
          .value()
      };
      data[entity] = result.rows;
      res.serialize(data);
    };
  };
  next();
};
