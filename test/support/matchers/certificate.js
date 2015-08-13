'use strict';

let _ = require('lodash');

/*
 * Ensure that our model has attributes matching machine certificates.
 *
 * For an example of machine certificates, see ../support/machine.js
 */
module.exports = function(certs) {
  return function(model) {
    _.keys(certs).forEach(type => {
      _.keys(certs[type]).forEach(name => {
        let attribute = `${type}_${name}`;

        if (model[attribute] !== certs[type][name]) {
          throw new Error(`${attribute} certificate is not matching.`);
        }
      });
    });
    return true;
  };
};
