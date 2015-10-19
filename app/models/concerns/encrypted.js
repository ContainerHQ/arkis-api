'use strict';

let _ = require('lodash'),
  validator = require('validator'),
  Encryption = require('../../support').Encryption;

module.exports = function(attributes) {
  let concern = {
    attributes: {},
    options: {
      getterMethods: {},
      instanceMethods: {}
    }
  };
  attributes.forEach(attribute => {
    concern.options.getterMethods[attribute] = function() {
      let encrypted = this.get(`encrypted_${attribute}`),
          decrypted = new Encryption('aes').decrypt(encrypted);

      return validator.isJSON(decrypted) ? JSON.parse(decrypted) : decrypted;
    };

    let methodName = `encrypt${_.capitalize(_.camelCase(attribute))}`;

    concern.options.instanceMethods[methodName] = function(value) {
      let text    = _.isPlainObject(value) ? JSON.stringify(value) : value,
        encrypted = new Encryption('aes').encrypt(text);

      this[`encrypted_${attribute}`] = encrypted;
    };
  });
  return concern;
};
