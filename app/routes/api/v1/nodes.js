'use strict';

let _ = require('lodash'),
  express = require('express'),
  middlewares = require('../../../middlewares'),
  services = require('../../../services'),
  Node = require('../../../models').Node;

let router = express.Router();

const CREATE_PARAMS = ['name', 'master', 'labels', 'byon', 'region', 'size'],
      UPDATE_PARAMS = ['name', 'master', 'labels'];

router
.get('/', middlewares.pagination, (req, res, next) => {
  Node
  .scope('defaultScope',
    { method: ['filtered', req.query] },
    { method: ['cluster',  req.cluster.id] },
    { method: ['state',    req.query.state] }
  ).findAndCount(req.pagination).then(res.paginate('nodes')).catch(next);
})
.post('/', (req, res, next) => {
  let node  = Node.build(_.pick(req.body, CREATE_PARAMS)),
    machine = new services.MachineManager(req.cluster, node);

  return machine.deploy().then(action => {
    res.status(202).serialize({ node: node, action: action });
  }).catch(next);
})
.param('node_id', middlewares.modelFinder('node', {
  belongsTo: 'cluster',
  findBy: { id: 'UUID', name: 'Ascii' }
}))

.post('/:node_id/upgrade', (req, res, next) => {
  let daemon = new services.DaemonManager(req.cluster, req.node);

  daemon.upgrade().then(action => {
    res.status(202).serialize({ node: req.node, action: action });
  }).catch(next);
})
.use('/:node_id/actions', require('./action')({ resource: 'node' }))

.route('/:node_id')
.get((req, res) => {
  res.serialize({ node: req.node });
})
.patch((req, res, next) => {
  let daemon = new services.DaemonManager(req.cluster, req.node);

  daemon.update(_.pick(req.body, UPDATE_PARAMS)).then(action => {
    res.status(202).serialize({ node: req.node, action: action });
  }).catch(next);
})
.delete((req, res, next) => {
  let machine = new services.MachineManager(req.cluster, req.node);

  machine.destroy().then(res.noContent).catch(next);
});

module.exports = router;
