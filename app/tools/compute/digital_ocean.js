'use strict';

let errors = require('../../support').errors,
  Client = require('do-wrapper');

const IMAGE_SLUG = 'ubuntu-14-04-x64';

class DigitalOcean {
  constructor(credentials) {
    this._client = new Client(credentials.token);
  }
  get label() {
    return 'DigitalOcean';
  }
  verifyCredentials() {
    return new Promise((resolve, reject) => {
      this._client.account((err, res) => {
        if (err) { return reject(err); }

        if (res.statusCode === 200) {
          return resolve();
        }
        reject(this._getError(res));
      });
    });
  }
  getRegions() {
    return new Promise((resolve, reject) => {
      this._client.regionsGetAll({}, (err, res, body) => {
        if (err) { return reject(err); }

        resolve(body.regions);
      });
    });
  }
  getSizes() {
    return new Promise((resolve, reject) => {
      this._client.sizesGetAll({}, (err, res, body) => {
        if (err) { return reject(err); }

        resolve(body.sizes);
      });
    });
  }
  createMachine(options) {
    return new Promise((resolve, reject) => {
      let config = {
        name: options.id,
        region: options.region,
        size: options.node_size,
        image: IMAGE_SLUG
      };
      this._client.dropletsCreate(config, (err, res, body) => {
        if (err) { return reject(err); }

        if (res.statusCode === 202) {
          return resolve(body.droplet);
        }
        reject(this._getError(res));
      });
    });
  }
  deleteMachine(id) {
    return new Promise((resolve, reject) => {
      this._client.dropletsDelete(id, (err, res) => {
        if (err) { return reject(err); }

        if (res.statusCode === 200) {
          return resolve();
        }
        reject(this._getError(res));
      });
    });
  }
  _getError(res) {
    return new errors.ProviderError({
      provider: this.label,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      message: res.body.message
    });
  }
}

module.exports = DigitalOcean;
