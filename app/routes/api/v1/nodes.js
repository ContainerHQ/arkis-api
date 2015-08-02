'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  handler = require('../../shared/handler'),
  middlewares = require('../../../middlewares'),
  Node = require('../../../models').Node;

let router = express.Router();

router
.get('/', middlewares.pagination, (req, res, next) => {
  Node
  .scope('defaultScope',
    { method: ['cluster', req.cluster.id] },
    { method: ['state', req.query.state] },
    { method: ['filtered', req.query] }
  ).findAndCount(req.pagination).then(res.paginate('nodes')).catch(next);
})
.post('/', handler.notYetImplemented)

.param('node_id', (req, res, next, id) => {
  /*
   * Sequelize is throwing a standard error instead of a validation error when
   * the specified id is not a uuid, therefore we need to check it manually
   * before using sequelize queries.
   */
  if (!validator.isUUID(id)) { return res.notFound(); }

  req.cluster.getNodes({ where: { id: id } })
  .then(nodes => {
    if (_.isEmpty(nodes)) { return res.notFound(); }

    req.node = _.first(nodes);
    next();
  }).catch(next);
})
.route('/:node_id')
.get((req, res) => {
  res.json({ node: req.node });
})
.delete((req, res, next) => {
  req.node.destroy().then(res.noContent).catch(next);
});

module.exports = router;
