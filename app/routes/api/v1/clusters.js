'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  handler = require('../../shared/handler'),
  Cluster = require('../../../models').Cluster;

let router = express.Router();

const CLUSTER_PARAMS = ['name', 'strategy', 'token'];

router
.get('/', (req, res, next) => {
  req.user.getClusters({
    limit: req.query.limit,
    offset: (req.query.page || 0) * (req.query.limit || 0),
    where: {
      strategy: {
        $like: req.query.strategy || '%'
      },
      name: {
        $like: req.query.name || '%'
      }
    }
  }).then(clusters => {
    /*
     * State is a virtual field updated after instanciation,
     * therefore it can't be in the db query.
     */
    if (!!req.query.state) {
      clusters = _.select(clusters, 'state', req.query.state);
    }
    res.json({ clusters: clusters });
  }).catch(next);
})
.post('/', (req, res, next) => {
  Cluster.create(_.pick(req.body, CLUSTER_PARAMS))
  .then(cluster => {
    return req.user.addCluster(cluster);
  }).then(cluster => {
    res.status(201).json({ cluster: cluster });
  }).catch(next);
})
.param('id', (req, res, next, id) => {
  if (!validator.isUUID(id)) { return res.status(404).json(); }

  req.user.getClusters({ where: { id: id } }).then(clusters => {
    if (clusters.length === 0) { return res.status(404).json(); }

    req.cluster = _.first(clusters);
    next();
  }).catch(next);
})
.route('/:id')
.get((req, res) => {
  res.json({ cluster: req.cluster });
})
.delete((req, res, next) => {
  req.cluster.destroy().then(handler.sendNoContent(res)).catch(next);
});

module.exports = router;
