var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler'),
  version = require('../../package.json').version;

let router = express.Router();

router
.get('/_ping', (req, res) => {
  req.docker.ping(handler.sendTo(res));
})
.get('/events', (req, res) => {
  req.docker.getEvents(req.query, handler.streamTo(res));
})
.get('/info', (req, res) => {
  req.docker.info(handler.sendTo(res));
})
.get('/version', (req, res) => {
  req.docker.version(handler.sendTo(res, (data) => {
    data.ApiVersion += ` (Docker Proxy ${version})`;
  }));
})
.post('/auth', (req, res) => {
  docker.checkAuth(req.body, handler.sendTo(res));
})
.post('/build', (req, res) => {
  let opts = _.merge(req.query, req.body);

  req.docker.buildImage(req, opts, handler.streamTo(res));
})
.post('/commit', (req, res) => {
  req.docker
  .getContainer(req.query.container)
  .commit(req.query, handler.sendTo(res, () => {
    res.status(201);
  }));
});

module.exports = router;
