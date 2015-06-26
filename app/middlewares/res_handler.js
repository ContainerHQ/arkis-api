'use strict';

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
  next();
};
