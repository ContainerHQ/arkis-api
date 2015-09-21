'use strict';

let _ = require('lodash'),
  validator = require('validator');

module.exports = function(modelName, { belongsTo }) {
  /*
   * Sequelize is throwing a standard error instead of a validation error when
   * the specified id is not a uuid, therefore we need to check it manually
   * before using sequelize queries.
   */
  return function(req, res, next, id) {
    if (!validator.isUUID(id)) { return res.notFound(); }

    let column = _.capitalize(modelName) + 's';

    req[belongsTo][`get${column}`]({ where: { id: id } })
    .then(models => {
      if (_.isEmpty(models)) { return res.notFound(); }

      req[modelName] = _.first(models);
      next();
    }).catch(next);
  };
};
