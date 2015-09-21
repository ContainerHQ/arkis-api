'use strict';

let express = require('express'),
  middlewares = require('../../../middlewares'),
  Action = require('../../../models').Action;

module.exports = function({ resource }) {
  let router  = express.Router();

  router
  .get('/', middlewares.pagination, (req, res, next) => {
    Action
    .scope('timeline',
      { method: ['filtered', req.query] },
      { method: [resource,   req[resource].id] },
      { method: ['state',    req.query.state] }
    ).findAndCount(req.pagination).then(res.paginate('actions')).catch(next);
  })
  .param('action_id', middlewares.modelFinder('action', {
    belongsTo: resource,
    findBy: { id: 'UUID' }
  }))
  .get('/:action_id', (req, res) => {
    res.serialize({ action: req.action });
  });
  return router;
};
