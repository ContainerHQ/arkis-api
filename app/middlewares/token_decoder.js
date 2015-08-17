'use strict';

let support = require('../support');

module.exports = function(req, res, next, token) {
  support.token.verify(token, (err, payload) => {
    if (err) { return res.unauthorized(); }

    req.token = payload;
    next();
  });
};
