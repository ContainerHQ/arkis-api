'use strict';

let _ = require('lodash'),
  validator = require('validator'),
  express = require('express'),
  middlewares = require('../../../middlewares'),
  Action = require('../../../models').Action;

module.exports = function({ resource }) {
  let router  = express.Router();

  router
  .get('/', middlewares.pagination, (req, res, next) => {
    Action
    .scope('defaultScope',
      { method: ['filtered', req.query] },
      { method: ['node',     req.node.id] },
      { method: ['state',    req.query.state] }
    ).findAndCount(req.pagination).then(res.paginate('actions')).catch(next);
  })
  .param('action_id', (req, res, next, id) => {
    if (!validator.isUUID(id)) { return res.notFound(); }

    req[resource].getActions({ where: { id: id } })
    .then(actions => {
      if (_.isEmpty(actions)) { return res.notFound(); }

      req.action = _.first(actions);
      next();
    }).catch(next);
  })
  .get('/:action_id', (req, res) => {
    res.json({ action: req.action });
  });
  return router;
};
