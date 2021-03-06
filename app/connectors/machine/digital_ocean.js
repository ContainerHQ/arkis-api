'use strict';

let _ = require('lodash'),
  uuid = require('node-uuid'),
  Client = require('do-wrapper'),
  config = require('../../../config'),
  errors = require('../../support').errors;

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
    return this._get('regions');
  }
  getSizes() {
    return this._get('sizes');
  }
  _get(resource) {
    return new Promise((resolve, reject) => {
      this._client[`${resource}GetAll`]({}, (err, res, body) => {
        if (err) { return reject(err); }

        let method = `_format${_.capitalize(resource)}`;

        resolve(this[method](body[resource]));
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
  addKey(publicKey) {
    let opts = {
      name: `${config.project}-` + uuid.v1(), public_key: publicKey
    };
    return new Promise((resolve, reject) => {
      this._client.accountAddKey(opts, (err, res, body) => {
        if (err) { return reject(err); }

        if (res.statusCode === 201) {
          return resolve(body.ssh_key.id);
        }
        reject(this._formatError(res));
      });
    });
  }
  removeKey(id) {
    return new Promise((resolve, reject) => {
      this._client.accountDeleteKey(id, (err, res) => {
        if (err) { return reject(err); }

        if (res.statusCode === 204) { return resolve(); }

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
      return _(size).omit('vcpus').merge({ cpu: size.vcpus }).value();
    });
  }
  _formatError(res) {
    switch (res.statusCode) {
      case 401:
        return new errors.MachineCredentialsError();
      case 404:
        return new errors.MachineNotFoundError();
      case 422:
        let message = res.body.message.replace('Droplet', 'machine');

        return new errors.MachineUnprocessableError(message);
      default:
        return new Error(res.body.message);
    }
  }
}

module.exports = DigitalOcean;
