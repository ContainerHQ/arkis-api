'use strict';

module.exports = function(attributes) {
  return function(model) {
    attributes.forEach(attribute => {
      if (model[attribute] !== null) {
        return false;
      }
    });
    return true;
  };
};
