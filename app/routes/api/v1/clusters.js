'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  errors = require('../../shared/errors'),
  Cluster = require('../../../models').Cluster;

let router = express.Router();

const CLUSTER_PARAMS = ['name', 'strategy', 'token'];

router
.get('/', (req, res, next) => {
  let criterias = {
    limit: parseInt(req.query.limit || 25),
    offset: parseInt(req.query.offset || 0),
    group: ['id'],
    where: {
      user_id: req.user.id,
      strategy: {
        $like: req.query.strategy || '%'
      },
      name: {
        $like: req.query.name || '%'
      }
    }
  };

  ['limit', 'offset'].forEach(attribute => {
    let value = criterias[attribute];

    if (value < 0) {
      next(new errors.PaginationError(attribute, value));
    }
  });

  Cluster
  .scope(['defaultScope', 'state'], { method: ['state', req.query.state] })
  .findAndCount(criterias).then(result => {
    res.json({
      meta: _.chain(criterias)
             .pick(['limit', 'offset'])
             .merge({ total_count: result.count.length }),
      clusters: result.rows
    });
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
  if (!validator.isUUID(id)) { return res.notFound(); }

  req.user.getClusters({ where: { id: id } }).then(clusters => {
    if (clusters.length === 0) { return res.notFound(); }

    req.cluster = _.first(clusters);
    next();
  }).catch(next);
})
.route('/:id')
.get((req, res) => {
  res.json({ cluster: req.cluster });
})
.delete((req, res, next) => {
  req.cluster.destroy().then(res.noContent).catch(next);
});

module.exports = router;
