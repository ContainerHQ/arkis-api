'use strict';

let _ = require('lodash'),
  validator = require('validator'),
  express = require('express');

module.exports = function({ resource }) {
  let router  = express.Router();

  router
  .param('action_id', (req, res, next, id) => {
    if (!validator.isUUID(id)) { return res.notFound(); }

    req[resource].getActions({ where: { id: id } })
    .then(actions => {
      if (_.isEmpty(actions)) { return res.notFound(); }

      req.action = _.first(actions);
      next();
    }).catch(next);
  })
  .get('/:action_id', (req, res) => {
    res.json({ action: req.action });
  });
  return router;
};
