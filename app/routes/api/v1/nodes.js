'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  middlewares = require('../../../middlewares'),
  services = require('../../../services'),
  Node = require('../../../models').Node;

let router = express.Router();

const CREATE_PARAMS = ['name', 'master', 'labels', 'byon', 'region', 'node_size'],
      UPDATE_PARAMS = ['name', 'master', 'labels'];

router
.get('/', middlewares.pagination, (req, res, next) => {
  Node
  .scope('defaultScope',
    { method: ['filtered', req.query] },
    { method: ['cluster', req.cluster.id] },
    { method: ['state', req.query.state] }
  ).findAndCount(req.pagination).then(res.paginate('nodes')).catch(next);
})
.post('/', (req, res, next) => {
  let node  = Node.build(_.pick(req.body, CREATE_PARAMS)),
    machine = new services.MachineManager(req.cluster, node),
    action;

  return machine.deploy().then(nodeAction => {
    action = nodeAction;
    return node.reload();
  }).then(node => {
    res.status(202).json({ node: node, action: action });
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
  let daemon = new services.DaemonManager(req.cluster, req.node),
    action;

  daemon.upgrade().then(nodeAction => {
    action = nodeAction;
    return req.node.reload();
  }).then(() => {
    res.status(202).json({ node: req.node, action: action });
  }).catch(next);
})

.route('/:node_id')
.get((req, res) => {
  res.json({ node: req.node });
})
.patch((req, res, next) => {
  let daemon = new services.DaemonManager(req.cluster, req.node),
    action;

  daemon.update(_.pick(req.body, UPDATE_PARAMS)).then(nodeAction => {
    action = nodeAction;
    return req.node.reload();
  }).then(() => {
    res.status(202).json({ node: req.node, action: action });
  }).catch(next);
})
.delete((req, res, next) => {
  let machine = new services.MachineManager(req.cluster, req.node);

  machine.destroy().then(res.noContent).catch(next);
});

module.exports = router;
