'use strict';

let _ = require('lodash'),
  express = require('express'),
  middlewares = require('../../../middlewares'),
  Node = require('../../../models').Node;

let router = express.Router();

const REGISTER_PARAMS = [
  'public_ip', 'cpu', 'memory', 'disk', 'swarm_version', 'docker_version'
];

router
.param('token', middlewares.tokenDecoder)
.param('token', (req, res, next) => {
  Node.findById(req.token.jit).then(node => {
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
.post('/:token/register', (req, res, next) => {
  req.node.register(_.pick(req.body, REGISTER_PARAMS)).then(() => {
    res.noContent();
  }).catch(next);
})
.post('/:token/live', (req, res, next) => {
  req.node.update({ last_ping: Date.now() }).then(() => {
    res.noContent();
  }).catch(next);
});

module.exports = router;
