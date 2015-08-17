'use strict';

let _ = require('lodash'),
  express = require('express'),
  middlewares = require('../../../middlewares'),
  services = require('../../../services'),
  Node = require('../../../models').Node;

let router = express.Router();

const REGISTER_PARAMS = [
  'cpu', 'memory', 'disk', 'swarm_version', 'docker_version'
];

router
.param('token', middlewares.tokenDecoder)
.param('token', (req, res, next) => {
  Node.findById(req.token.jit).then(node => {
    if (!node) { return res.notFound(); }

    req.agent = new services.AgentManager(node);
    next();
  });
})
.get('/:token/infos', (req, res, next) => {
  req.agent.infos().then(infos => {
    res.json(infos);
  }).catch(next);
})
.post('/:token/notify', (req, res, next) => {
  req.agent.notify(_.pick(req.body, REGISTER_PARAMS)).then(() => {
    res.noContent();
  }).catch(next);
})
.get('/clusters/:token', (req, res, next) => {
  req.agent.fetch().then(addresses => {
    res.json(addresses);
  }).catch(next);
})
.post('/clusters/:token', (req, res, next) => {
  let addr = _.first(_.keys(req.body));

  req.agent.register(addr).then(() => {
    res.noContent();
  }).catch(next);
});

module.exports = router;
