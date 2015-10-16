'use strict';

let validator = require('validator'),
  Encryption = require('../../../app/support').Encryption;

module.exports = function(attribute, { algorithm }) {
  return function(model) {
    if (!!model.dataValues[attribute]) {
      throw `${attribute} is persistent but it should not.`;
    }
    let encrypted = model[`encrypted_${attribute}`],
        decrypted = new Encryption(algorithm).decrypt(encrypted);

    return model[attribute] ===
      validator.isJSON(decrypted) ? JSON.parse(decrypted): decrypted;
  };
};
