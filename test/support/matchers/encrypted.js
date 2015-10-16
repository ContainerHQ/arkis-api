'use strict';

let Encryption = require('../../../app/support').Encryption;

module.exports = function(attribute, { algorithm }) {
  return function(model) {
    if (!!model.dataValues[attribute]) {
      throw `${attribute} is persistent but it should not.`;
    }
    let encrypted = model[`encrypted_${attribute}`];

    return model[attribute] === new Encryption(algorithm).decrypt(encrypted);
  };
};
