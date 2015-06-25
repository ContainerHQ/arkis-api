'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  handler = require('../../shared/handler');

let router = express.Router();

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
.post('/', handler.notYetImplemented)
// req.user.addCluster();
//
//
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
