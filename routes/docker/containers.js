var _ = require('lodash'),
  express = require('express'),
  handler = require('../common/handler'),
  docker = require('../../config').docker;

let router = express.Router()

router
.get('/json', (req, res) => {
  docker.listContainers(req.query, handler.sendTo(res));
})
.post('/create', (req, res) => {
  let opts = _.merge(req.query, req.body);

  docker.createContainer(opts, handler.sendTo(res, container => {
    res.status(201);
    // TODO: add warnings
    return { Id: container.id };
  }));
})

.param('id', (req, res, next, id) => {
  req.container = docker.getContainer(id);
  next();
})
.get('/:id/export', (req, res) => {
  req.container.export(handler.streamTo(res, 'application/octed-stream'));
})
.get('/:id/changes', (req, res) => {
  req.container.changes(handler.sendTo(res));
})
.get('/:id/json', (req, res) => {
  req.container.inspect(handler.sendTo(res));
})
.get('/:id/top', (req, res) => {
  req.container.top(req.query, handler.sendTo(res));
})
.get('/:id/logs', (req, res) => {
  req.container.logs(req.query, handler.streamTo(res,
    'application/vnd.docker.raw-stream'
  ));
})
.get('/:id/stats', (req, res) => {
  req.container.stats(handler.streamTo(res));
})
.post('/:id/attach', (req, res) => {
  req.container.attach(req.query, handler.hijack(req.socket));
})
.post('/:id/start', (req, res) => {
  req.container.start(req.query, handler.noContent(res));
})
.post('/:id/stop', (req, res) => {
  req.container.stop(req.query, handler.noContent(res));
})
.post('/:id/kill', (req, res) => {
  req.container.kill(req.query, handler.noContent(res));
})
.post('/:id/restart', (req, res) => {
  req.container.restart(req.query, handler.noContent(res));
})
.post('/:id/pause', (req, res) => {
  req.container.pause(req.query, handler.noContent(res));
})
.post('/:id/unpause', (req, res) => {
  req.container.unpause(req.query, handler.noContent(res));
})
.post('/:id/rename', (req, res) => {
  req.container.rename(req.query, handler.sendTo(res));
})
.post('/:id/resize', (req, res) => {
  req.container.resize(req.query, handler.sendTo(res));
})
.post('/:id/wait', (req, res) => {
  req.container.wait(handler.sendTo(res));
})
.post('/:id/copy', (req, res) => {
  req.container.copy(req.body, handler.streamTo(res));
})
.post('/:id/exec', (req, res) => {
  req.container.exec(req.body, handler.sendTo(res, exec => {
    res.status(201);
    return { Id: exec.id };
  }));
})
.delete('/:id', (req, res) => {
  req.container.remove(req.query, handler.noContent(res));
});

module.exports = router;
