'use strict';

let _ = require('lodash'),
  express = require('express'),
  middlewares = require('../../../middlewares'),
  services = require('../../../services'),
  Cluster = require('../../../models').Cluster;

let router = express.Router();

const CREATE_PARAMS = ['name', 'strategy', 'token'],
      UPDATE_PARAMS = ['name'];

router
.get('/', middlewares.pagination, (req, res, next) => {
  Cluster
  .scope('defaultScope',
    { method: ['filtered', req.query] },
    { method: ['user', req.user.id] },
    { method: ['state', req.query.state] }
  ).findAndCount(req.pagination).then(res.paginate('clusters')).catch(next);
})
.post('/', (req, res, next) => {
  req.user.createCluster(_.pick(req.body, CREATE_PARAMS)).then(cluster => {
    res.status(201).serialize({ cluster: cluster });
  }).catch(next);
})
.param('cluster_id', middlewares.modelFinder('cluster', {
  belongsTo: 'user', findBy: { id: 'UUID', name: 'Ascii' }
}))

.post('/:cluster_id/upgrade', (req, res, next) => {
  let clusterManager = new services.ClusterManager(req.cluster);

  clusterManager.upgrade().then(upgradeResult => {
    res.status(202).serialize(
      _.merge({ cluster: req.cluster }, upgradeResult)
    );
  }).catch(next);
})

.use('/:cluster_id/nodes', require('./nodes'))

.route('/:cluster_id')
.get((req, res) => {
  res.serialize({ cluster: req.cluster });
})
.patch((req, res, next) => {
  req.cluster.update(_.pick(req.body, UPDATE_PARAMS)).then(cluster => {
    res.serialize({ cluster: cluster });
  }).catch(next);
})
.delete((req, res, next) => {
  req.cluster.destroy().then(res.noContent).catch(next);
});

module.exports = router;
