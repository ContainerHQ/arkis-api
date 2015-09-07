'use strict';

let Serialize = require('../support').Serialize;

module.exports = function(req, res, next) {
  res.notFound = function() {
    res.status(404).json();
  };
  res.noContent = function() {
    res.status(204).json();
  };
  res.unauthorized = function() {
    res.status(401).json();
  };
  res.forbidden = function() {
    res.status(403).json();
  };
  res.serialize = function(data) {
    let serialized = Serialize.all(data, { baseUrl: req.baseUrl });

    return res.json(serialized);
  };
  next();
};
