'use strict';

let Serialize = require('../support').Serialize;

module.exports = function(req, res, next) {
  res.notFound = function() {
    res.status(404).json({
      name: 'not_found',
      message: 'The requested resource cannot be found.'
    });
  };
  res.noContent = function() {
    res.status(204).json();
  };
  res.unauthorized = function() {
    res.status(401).json({
      name: 'unauthorized',
      message: 'API token is wrong or the resource associated has been deleted.'
    });
  };
  res.forbidden = function() {
    res.status(403).json({
      name: 'forbidden',
      message: 'The action or resource requested is forbidden.'
    });
  };
  res.serialize = function(data) {
    let serialized = Serialize.all(data, { baseUrl: req.baseUrl });

    return res.json(serialized);
  };
  next();
};
