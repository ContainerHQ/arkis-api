'use strict';

let express = require('express'),
  validator = require('validator'),
  handler = require('../../shared/handler'),
  Node = require('../../../models').Node;

let router = express.Router();

router
.get('/', handler.notYetImplemented)
.post('/', handler.notYetImplemented)

.param('node_id', (req, res, next, id) => {
  if (!validator.isUUID(id)) { return res.notFound(); }

  Node.findOne({ where: { id: id, cluster_id: req.cluster.id } })
  .then(node => {
    if (!node) { return res.notFound(); }

    req.node = node;
    next();
  }).catch(next);
})
.route('/:node_id')
.get((req, res) => {
  res.json({ node: req.node });
})
.delete(handler.notYetImplemented);

module.exports = router;
