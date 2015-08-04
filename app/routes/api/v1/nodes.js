'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  middlewares = require('../../../middlewares'),
  Node = require('../../../models').Node;

let router = express.Router();

const CREATE_PARAMS = ['name', 'master', 'byon', 'region', 'node_size'],
      UPDATE_PARAMS = ['name'];

router
.get('/', middlewares.pagination, (req, res, next) => {
  Node
  .scope('defaultScope',
    { method: ['cluster', req.cluster.id] },
    { method: ['state', req.query.state] },
    { method: ['filtered', req.query] }
  ).findAndCount(req.pagination).then(res.paginate('nodes')).catch(next);
})
/*
 * Node must be reloaded in order to get its virtual attributes.
 */
.post('/', (req, res, next) => {
  req.cluster.createNode(_.pick(req.body, CREATE_PARAMS)).then(node => {
    return node.reload();
  }).then(node => {
    res.status(201).json({ node: node });
  }).catch(next);
})
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
.post('/:node_id/upgrade', (req, res, next) => {
  req.node.upgrade({
    docker: req.cluster.docker_version,
    swarm:  req.cluster.swarm_version
  }).then(() => {
    res.noContent();
  }).catch(next);
})

.route('/:node_id')
.get((req, res) => {
  res.json({ node: req.node });
})
.patch((req, res, next) => {
  req.node.update(_.pick(req.body, UPDATE_PARAMS)).then(node => {
    res.json({ node: node });
  }).catch(next);
})
.delete((req, res, next) => {
  req.node.destroy().then(res.noContent).catch(next);
});

module.exports = router;
