'use strict';

let _ = require('lodash'),
  express = require('express'),
  Node = require('../../../models').Node;

let router = express.Router();

const REGISTER_PARAMS = [
  'public_ip', 'cpu', 'memory', 'disk', 'swarm_version', 'docker_version'
];

router
.param('token', (req, res, next, token) => {
  Node.findOne({ where: { token: token } }).then(node => {
    if (!node) { return res.notFound(); }

    req.node = node;
    next();
  });
})
.get('/:token/infos', (req, res, next) => {
  req.node.agentInfos().then(infos => {
    res.json(infos);
  }).catch(next);
})
.patch('/:token/register', (req, res, next) => {
  req.node.register(_.pick(req.body, REGISTER_PARAMS)).then(() => {
    res.noContent();
  }).catch(next);
})
.patch('/:token/live', (req, res, next) => {
  req.node.update({ last_ping: Date.now() }).then(() => {
    res.noContent();
  }).catch(next);
});

module.exports = router;
