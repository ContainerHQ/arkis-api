'use strict';

let _ = require('lodash'),
  models = require('../models');

module.exports = function(queue) {
  class ActionJob {
    constructor(action) {
      this.action = action;
      this.queue  = queue;
    }
    create() {
      return this.queue
      .create(this.type, { action_id: this.action.id })
      .removeOnComplete(true).save();
    }
    retrieve(modelNames) {
      let modelName = _.capitalize(this.action.resource);

      return models[modelName].findOne({
        include: this._include(modelNames),
        where: { id: this.action.resource_id }
      }).then(model => {
        let result = {};

        result[this.action.resource] = model;

        modelNames.forEach(modelName => {
          result[modelName.toLowerCase()] = model = model[modelName];
        });
        return result;
      });
    }
    _include(modelNames, include=[], cursor=include) {
      if (modelNames.length <= 0) { return include; }

      let modelName = _.first(modelNames);

      modelNames = _.pull(_.clone(modelNames), modelName);

      cursor.push({ model: models[modelName], include: [] });

      if (modelNames.length <= 0) {
        delete _.first(cursor).include;

        return include;
      }
      return this._include(modelNames, include, _.first(cursor).include);
    }
  }
  return ActionJob;
};
