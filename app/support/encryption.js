'use strict';

let crypto = require('crypto'),
  secrets = require('../../config').secrets;

class Encryption {
  constructor(algorithm) {
    this.password  = secrets[algorithm];
    this.algorithm = `${algorithm}-256-ctr`;
  }
  encrypt(text) {
    let cipher = crypto.createCipher(this.algorithm, this.password);

    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  }
  decrypt(text) {
    let decipher = crypto.createDecipher(this.algorithm, this.password);

    return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
  }
}

module.exports = Encryption;
