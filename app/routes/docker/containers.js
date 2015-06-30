'use strict';

let _ = require('lodash'),
  express = require('express');

let router = express.Router();

router
.get('/json', (req, res) => {
  req.docker.listContainers(req.query, res.docker());
})
.post('/create', (req, res) => {
  let opts = _.merge(req.query, req.body);

  req.docker.createContainer(opts, res.docker({status: 201}, container => {
    // TODO: add warnings
    return { Id: container.id };
  }));
})

.param('id', (req, res, next, id) => {
  req.container = req.docker.getContainer(id);
  next();
})
.get('/:id/export', (req, res) => {
  req.container.export(res.docker(
    {stream: true, type: 'application/octed-stream'}
  ));
})
.get('/:id/changes', (req, res) => {
  req.container.changes(res.docker());
})
.get('/:id/json', (req, res) => {
  req.container.inspect(res.docker());
})
.get('/:id/top', (req, res) => {
  req.container.top(req.query, res.docker());
})
.get('/:id/logs', (req, res) => {
  req.container.logs(req.query, res.docker(
    {stream: true, type: 'application/vnd.docker.raw-stream'}
  ));
})
.get('/:id/stats', (req, res) => {
  req.container.stats(res.docker({stream: true}));
})
.post('/:id/attach', (req, res) => {
  req.container.attach(req.query, res.hijack());
})
.post('/:id/start', (req, res) => {
  req.container.start(req.query, res.docker({status: 204}));
})
.post('/:id/stop', (req, res) => {
  req.container.stop(req.query, res.docker({status: 204}));
})
.post('/:id/kill', (req, res) => {
  req.container.kill(req.query, res.docker({status: 204}));
})
.post('/:id/restart', (req, res) => {
  req.container.restart(req.query, res.docker({status: 204}));
})
.post('/:id/pause', (req, res) => {
  req.container.pause(req.query, res.docker({status: 204}));
})
.post('/:id/unpause', (req, res) => {
  req.container.unpause(req.query, res.docker({status: 204}));
})
.post('/:id/rename', (req, res) => {
  req.container.rename(req.query, res.docker());
})
.post('/:id/resize', (req, res) => {
  req.container.resize(req.query, res.docker());
})
.post('/:id/wait', (req, res) => {
  req.container.wait(res.docker(res));
})
.post('/:id/copy', (req, res) => {
  req.container.copy(req.body, res.docker());
})
.post('/:id/exec', (req, res) => {
  req.container.exec(req.body, res.docker({status: 201}, exec => {
    return { Id: exec.id };
  }));
})
.delete('/:id', (req, res) => {
  req.container.remove(req.query, res.docker({status: 204}));
});

module.exports = router;
