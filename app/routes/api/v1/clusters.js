'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
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
    res.status(201).json({ cluster: cluster });
  }).catch(next);
})
.param('cluster_id', (req, res, next, id) => {
  /*
   * Sequelize is throwing a standard error instead of a validation error when
   * the specified id is not a uuid, therefore we need to check it manually
   * before using sequelize queries.
   */
  if (!validator.isUUID(id)) { return res.notFound(); }

  req.user.getClusters({ where: { id: id } }).then(clusters => {
    if (_.isEmpty(clusters)) { return res.notFound(); }

    req.cluster = _.first(clusters);
    next();
  }).catch(next);
})
.post('/:cluster_id/upgrade', (req, res, next) => {
  let clusterManager = new services.ClusterManager(req.cluster);

  clusterManager.upgrade().then(upgradeResult => {
    res.status(202).json(
      _.merge({ cluster: req.cluster }, upgradeResult)
    );
  }).catch(next);
})

.use('/:cluster_id/nodes', require('./nodes'))

.route('/:cluster_id')
.get((req, res) => {
  res.json({ cluster: req.cluster });
})
.patch((req, res, next) => {
  req.cluster.update(_.pick(req.body, UPDATE_PARAMS)).then(cluster => {
    res.json({ cluster: cluster });
  }).catch(next);
})
.delete((req, res, next) => {
  req.cluster.destroy().then(res.noContent).catch(next);
});

module.exports = router;
