var _ = require('lodash'),
  express = require('express'),
  handler = require('../../shared/handler');

let router = express.Router();

router
.get('/json', (req, res) => {
  req.docker.listContainers(req.query, handler.docker(res));
})
.post('/create', (req, res) => {
  let opts = _.merge(req.query, req.body);

  req.docker.createContainer(opts, handler.docker(res, {status: 201}, container => {
    // TODO: add warnings
    return { Id: container.id };
  }));
})

.param('id', (req, res, next, id) => {
  req.container = req.docker.getContainer(id);
  next();
})
.get('/:id/export', (req, res) => {
  req.container.export(handler.docker(res,
    {stream: true, type: 'application/octed-stream'}
  ));
})
.get('/:id/changes', (req, res) => {
  req.container.changes(handler.docker(res));
})
.get('/:id/json', (req, res) => {
  req.container.inspect(handler.docker(res));
})
.get('/:id/top', (req, res) => {
  req.container.top(req.query, handler.docker(res));
})
.get('/:id/logs', (req, res) => {
  req.container.logs(req.query, handler.docker(res,
    {stream: true, type: 'application/vnd.docker.raw-stream'}
  ));
})
.get('/:id/stats', (req, res) => {
  req.container.stats(handler.docker(res, {stream: true}));
})
.post('/:id/attach', (req, res) => {
  req.container.attach(req.query, handler.hijack(res));
})
.post('/:id/start', (req, res) => {
  req.container.start(req.query, handler.docker(res, {status: 204}));
})
.post('/:id/stop', (req, res) => {
  req.container.stop(req.query, handler.docker(res, {status: 204}));
})
.post('/:id/kill', (req, res) => {
  req.container.kill(req.query, handler.docker(res, {status: 204}));
})
.post('/:id/restart', (req, res) => {
  req.container.restart(req.query,handler.docker(res, {status: 204}));
})
.post('/:id/pause', (req, res) => {
  req.container.pause(req.query, handler.docker(res, {status: 204}));
})
.post('/:id/unpause', (req, res) => {
  req.container.unpause(req.query, handler.docker(res, {status: 204}));
})
.post('/:id/rename', (req, res) => {
  req.container.rename(req.query, handler.docker(res));
})
.post('/:id/resize', (req, res) => {
  req.container.resize(req.query, handler.docker(res));
})
.post('/:id/wait', (req, res) => {
  req.container.wait(handler.docker(res));
})
.post('/:id/copy', (req, res) => {
  req.container.copy(req.body, handler.docker(res));
})
.post('/:id/exec', (req, res) => {
  req.container.exec(req.body, handler.docker(res, {status: 201}, exec => {
    return { Id: exec.id };
  }));
})
.delete('/:id', (req, res) => {
  req.container.remove(req.query, handler.docker(res, {status: 204}));
});

module.exports = router;
