var _ = require('lodash'),
  express = require('express'),
  handler = require('./handler'),
  docker = require('../../config').docker;

let router = express.Router()

// TODO: use middleware to merge opts:
//
// Very usefull to avoid duplication, and then
// to parse request opts when it will be necessary (like adding labels, etc);
// beside, body and query won't be both with something except when
// necessary
router
  .get('/json', (req, res) => {
    docker.listContainers(req.query, (err, data) => {
      console.log(err);
      res.send(data);
    });
  })
  .post('/create', (req, res) => {
    let opts = _.merge(req.query, req.body);

    docker.createContainer(opts, (err, container) => {
      if (err) return res.status(err.statusCode).send(err.json);

      let data = {};

      Object.keys(container).forEach((key) => {
        data[_.capitalize(key)] = container[key];
      });

      res.status(201).send(data);
    });
  })

  .param('id', (req, res, next, id) => {
    req.container = docker.getContainer(id);
    next();
  })
  .get('/:id/export', (req, res) => {
    req.container.export((err, data) => {
      res.contentType('application/octet-stream');

      data.pipe(res);
    });
  })
  .get('/:id/changes', (req, res) => {
    req.container.changes(handler.sendTo(res));
  })
  .get('/:id/json', (req, res) => {
    req.container.inspect((err, data) => {
      if (err) {
        let id = req.query.id;

        return res.redirect(`/images/${id}/json`);
      }

      res.send(data);
    });
  })
  .get('/:id/top', (req, res) => {
    req.container.top(req.query, handler.sendTo(res));
  })
  .get('/:id/logs', (req, res) => {
    req.container.logs(req.query, (err, data) => {
      res.contentType('application/vnd.docker.raw-stream');

      data.pipe(res);
    });
  })
  .get('/:id/stats', (req, res) => {
    req.container.stats((err, data) => {
      res.contentType('application/json');

      data.pipe(res);
    });
  })
  .post('/:id/attach', (req, res) => {
    req.container.attach(req.query, (err, stream) => {
      res.socket.write('101\r\n');

      res.socket.pipe(stream).pipe(res.socket);
    });
  })
  .post('/:id/start', (req, res) => {
    req.container.start(req.query, handler.sendTo(res));
  })
  .post('/:id/stop', (req, res) => {
    req.container.stop(req.query, (err, data) => {
      res.status(204).send();
    });
  })
  .post('/:id/kill', (req, res) => {
    req.container.kill(req.query, (err, data) => {
      res.status(204).send();
    });
  })
  .post('/:id/restart', (req, res) => {
    req.container.restart(req.query, (err, data) => {
      res.status(204).send();
    });
  })
  .post('/:id/pause', (req, res) => {
    req.container.pause(req.query, (err, data) => {
      res.status(204).send();
    });
  })
  .post('/:id/unpause', (req, res) => {
    req.container.unpause(req.query, (err, data) => {
      res.status(204).send();
    });
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
  .post('/containers/:id/copy', handler.notImplemented)
  .post('/containers/:id/exec', handler.notImplemented)
  .delete('/:id', (req, res) => {
    req.container.remove(req.query, (err, data) => {
      res.status(204).send();
    });
  });

module.exports = router;
