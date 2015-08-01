'use strict';

let _ = require('lodash'),
  express = require('express'),
  validator = require('validator'),
  handler = require('../../shared/handler');

let router = express.Router();

router
.get('/', handler.notYetImplemented)
.post('/', handler.notYetImplemented)

.param('node_id', (req, res, next, id) => {
  if (!validator.isUUID(id)) { return res.notFound(); }

  req.cluster.getNodes({ where: { id: id } })
  .then(nodes => {
    if (_.isEmpty(nodes)) { return res.notFound(); }

    req.node = _.first(nodes);
    next();
  }).catch(next);
})
.route('/:node_id')
.get((req, res) => {
  res.json({ node: req.node });
})
.delete((req, res, next) => {
  req.node.destroy().then(res.noContent).catch(next);
});

module.exports = router;
