'use strict';

let _ = require('lodash'),
  express = require('express'),
  handler = require('../../shared/handler');

let router = express.Router();

router
.get('/', handler.notYetImplemented)
.post('/', handler.notYetImplemented)
// req.user.addCluster();
//
//
.param('id', (req, res, next, id) => {
  req.user.getClusters({ where: { id: id } }).then(clusters => {
    req.cluster = _.first(clusters);

    if (!req.cluster) { return res.status(404).json(); }

    next();
  }).catch(next);
})
.route('/:id')
.get((req, res) => {
  res.status(200).json({ cluster: req.cluster });
})
.delete((req, res, next) => {
  req.cluster.destroy().then(() => {
    res.status(204).json();
  }).catch(next);
});

module.exports = router;
