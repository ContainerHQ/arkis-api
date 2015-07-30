'use strict';

let express = require('express'),
  Node = require('../../../models').Node;

let router = express.Router();

router
.param('token', (req, res, next, token) => {
  Node.findOne({ where: { token: token } }).then(node => {
    if (!node) { return res.notFound(); }

    req.node = node;
    next();
  });
})
.get('/:token/infos', (req, res) => {
  res.noContent();
})
.post('/:token/register', (req, res) => {
  res.noContent();
})
.get('/:token/live', (req, res, next) => {
  req.node.update({ last_ping: Date.now() }).then(() => {
    res.noContent();
  }).catch(next);
});

module.exports = router;
