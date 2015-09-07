'use strict';

let _ = require('lodash');

module.exports = function({ attribute, scope }) {
  let scopeId    = `${scope}_id`,
    errorMessage = `${_.capitalize(attribute)} must be unique per ${scope}!`;

  return {
    isUnique: function(value) {
      if (!value || !this[scopeId]) { return Promise.resolve(); }

      let models  = require('../../models'),
        modelName = this.__options.name.singular;

      return models[modelName].findOne({ where:
        _.pick(this, scopeId, attribute)
      }).then(result => {
        if (result) { return Promise.reject(errorMessage); }
      });
    }
  };
};
