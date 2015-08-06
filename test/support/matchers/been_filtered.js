'use strict';

let _ = require('lodash');

/*
 *  Verify that the tested instance hasn't been created or
 *  updated with a specified blacklist of attributes.
 *
 * @original: Model instance before create/update
 * @attributes: Attributes that should be filtered
 *
 */
module.exports = function(original, attributes) {
  return function(instance) {
    if (instance === null) {
      throw new Error('Model instance is null');
    }
    attributes.forEach(attribute => {
      /*
       * If an attribute has been updated on the targeted instance,
       * this matcher throw an error to help us identify witch attribute
       * failed and pass through the filters.
       */
       let instanceValue = instance.dataValues[attribute],
           originalValue = original.dataValues[attribute];
      if (
          !_.isEqual(instanceValue, originalValue) &&
          !_.isUndefined(originalValue) && !_.isNull(originalValue) &&
          !_.isUndefined(instanceValue) && !_.isNull(instanceValue)
        ) {
        throw new Error(`${attribute} is not filtered!`);
      }
    });
    return true;
  };
};
