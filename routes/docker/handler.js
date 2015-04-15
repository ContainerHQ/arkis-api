module.exports.notImplemented = function(req, res) {
  res.status(404).json('Not yet implemented.');
};

module.exports.sendTo = function(res, callback) {
  return function (err, data) {
    if (err) {
      return res.status(err.statusCode).send(err.json);
    }
    if (typeof callback === 'function') {
      data = callback(data);
    }
    res.send(data);
  };
};

module.exports.streamTo = function(res, type='application/json') {
  return function (err, data) {
    if (err) {
      return res.status(err.statusCode).send(err.json);
    }
    res.contentType(type);
    data.pipe(res);
  };
};