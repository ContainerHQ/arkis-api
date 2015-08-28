'use strict';

let _ = require('lodash'),
  errors = require('../../support').errors,
  Client = require('do-wrapper');

const IMAGE_SLUG = 'ubuntu-14-04-x64';

class DigitalOcean {
  constructor(credentials) {
    this._client = new Client(credentials.token);
  }
  verifyCredentials() {
    return new Promise((resolve, reject) => {
      this._client.account((err, res) => {
        if (err) { return reject(err); }

        if (res.statusCode === 200) {
          return resolve();
        }
        reject(this._formatError(res));
      });
    });
  }
  getRegions() {
    return new Promise((resolve, reject) => {
      this._client.regionsGetAll({}, (err, res, body) => {
        if (err) { return reject(err); }

        resolve(this._formatRegions(body.regions));
      });
    });
  }
  getSizes() {
    return new Promise((resolve, reject) => {
      this._client.sizesGetAll({}, (err, res, body) => {
        if (err) { return reject(err); }

        resolve(this._formatSizes(body.sizes));
      });
    });
  }
  create(options) {
    return new Promise((resolve, reject) => {
      let opts = _.merge({ image: IMAGE_SLUG }, options);

      this._client.dropletsCreate(opts, (err, res, body) => {
        if (err) { return reject(err); }

        if (res.statusCode === 202) {
          return resolve(body.droplet.id);
        }
        reject(this._formatError(res));
      });
    });
  }
  delete(id) {
    return new Promise((resolve, reject) => {
      this._client.dropletsDelete(id, (err, res) => {
        if (err) { return reject(err); }

        if (res.statusCode === 200) {
          return resolve();
        }
        reject(this._formatError(res));
      });
    });
  }
  _formatRegions(regions) {
    return _.map(regions || [], region => {
      return _.omit(region, 'features');
    });
  }
  _formatSizes(sizes) {
    return _.map(sizes || [], size => {
      let formated = _.omit(size, 'vcpus');

      _.merge(formated, { cpu: size.vcpus });
      return formated;
    });
  }
  _formatError(res) {
    switch (res.statusCode) {
      case 401:
        return new errors.MachineCredentialsError();
      case 404:
        return new errors.MachineNotFoundError();
      case 422:
        return new errors.MachineInvalidError();
      default:
        return new Error(res);
    }
  }
}

module.exports = DigitalOcean;
