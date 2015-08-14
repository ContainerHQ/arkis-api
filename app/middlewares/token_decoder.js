'use strict';

let services = require('../services');

module.exports = function(req, res, next, token) {
  services.token.verify(token, (err, payload) => {
    if (err) { return res.unauthorized(); }

    req.token = payload;
    next();
  });
};
