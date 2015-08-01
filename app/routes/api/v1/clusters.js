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
      meta: _(criterias)
        .pick(['limit', 'offset'])
        .merge({ total_count: result.count.length }),
      clusters: result.rows
    });
  }).catch(next);
})
.post('/', (req, res, next) => {
  req.user.createCluster(_.pick(req.body, CLUSTER_PARAMS))
  .then(cluster => {
    res.status(201).json({ cluster: cluster });
  }).catch(next);
})
.param('cluster_id', (req, res, next, id) => {
  if (!validator.isUUID(id)) { return res.notFound(); }

  Cluster.findOne({ where: { id: id, user_id: req.user.id } })
  .then(cluster => {
    if (!cluster) { return res.notFound(); }

    req.cluster = cluster;
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
