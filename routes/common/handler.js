module.exports.notImplemented = function(req, res) {
  res.status(404).json('Not yet implemented.');
};

function sendErrorTo(res, err) {
  res.status(err.statusCode).send(err.json);
}

module.exports.sendTo = function(res, callback) {
  return function(err, data) {
    if (err) {
      return sendErrorTo(res, err);
    }
    if (typeof callback === 'function') {
      data = callback(data) || data;
    }
    res.send(data);
  };
};

module.exports.streamTo = function(res, type='application/json') {
  return function(err, data) {
    if (err) {
      return sendErrorTo(res, err);
    }
    res.contentType(type);
    data.pipe(res);
  };
};

module.exports.noContent = function(res) {
  return function(err, data) {
    if (err) {
      return sendErrorTo(res, err);
    }
    res.status(204).send();
  };
};

module.exports.hijack = function(socket) {
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
