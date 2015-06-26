'use strict';

let http = require('http'),
  Docker = require('dockerode');

http.globalAgent.maxSockets = 1000;

const CURRENT_DOCKER = new Docker();

module.exports = function(req, res, next) {
  req.docker = CURRENT_DOCKER;
  res.docker = function(opts={}, callback=opts) {
    let stream = opts.stream || false,
      type = opts.type || 'application/json',
      status = opts.status || 200;

    return function(err, data) {
      /*
       * If an error happened with dockerode, this send
       * the error back to the client.
       *
       */
      if (err) {
        return res.status(err.statusCode).json(err.json);
      }

      res.status(status);

      /*
       * In streaming mode, we get from drockerode a stream
       * that we need to pipe to the response.
       *
       */
      if (stream) {
        res.contentType(type);

        return data.pipe(res);
      }

      /*
       * In non streaming mode, this allow us to
       * modify the data returned by dockerode before
       * sending it to the client.
       *
       */
      if (_.isFunction(callback)) {
        data = callback(data) || data;
      }
      res.json(data);
    };
  };
  res.hijack = function(socket) {
    return function(err, stream) {
      if (err) {
        return socket.write(`HTTP/1.1 ${err.statusCode}\r\n\r\n`);
      }

      socket.write('HTTP/1.1 101 UPGRADED\r\n');
      socket.write('Content-Type: application/vnd.docker.raw-stream\r\n');
      socket.write('Connection: Upgrade\r\n');
      socket.write('Upgrade: tcp\r\n');
      socket.write('\r\n');

      socket.pipe(stream, { end: false }).pipe(socket);
    };
  };
  next();
};
