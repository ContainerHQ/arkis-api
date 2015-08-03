'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  middlewares = require('../../../middlewares'),
  Cluster = require('../../../models').Cluster;

let router = express.Router();

const CREATE_PARAMS = ['name', 'strategy', 'token'];

router
.get('/', middlewares.pagination, (req, res, next) => {
  Cluster
  .scope('defaultScope',
    { method: ['user', req.user.id] },
    { method: ['state', req.query.state] },
    { method: ['filtered', req.query] }
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
.use('/:cluster_id/nodes', require('./nodes'))
.route('/:cluster_id')
.get((req, res) => {
  res.json({ cluster: req.cluster });
})
.delete((req, res, next) => {
  req.cluster.destroy().then(res.noContent).catch(next);
});

module.exports = router;
