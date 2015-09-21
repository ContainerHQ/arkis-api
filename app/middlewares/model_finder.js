'use strict';

let _ = require('lodash'),
  validator = require('validator');

class Finder {
  constructor(owner, modelName) {
    this.owner     = owner;
    this.modelName = modelName;
  }
  search(query) {
    return this.owner[`get${this.column}`](query);
  }
  get column() {
    return _.capitalize(this.modelName) + 's';
  }
}

/*
 * Sequelize is throwing a standard error when querying uuids if the identifier
 * is not a uuid, therefore we need to skip this case and directly query the
 * next attribute.
 */
module.exports = function(modelName, { belongsTo, findBy }) {
  return function(req, res, next, identifier) {
    let finder = new Finder(req[belongsTo], modelName);

    let promises = _.mapValues(findBy, (type, attribute) => {
      if (!validator[`is${type}`](identifier)) {
        return Promise.resolve([]);
      }
      let opts = {};

      opts[attribute] = identifier;

      return finder.search({ where: opts });
    });

    Promise.all(_.values(promises))
    .then(_.flatten).then(models => {
      if (_.isEmpty(models)) { return res.notFound(); }

      req[modelName] = _.first(models);
      next();
    }).catch(next);
  };
};
