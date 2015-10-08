'use strict';

let _ = require('lodash'),
  pem = require('pem'),
  uuid = require('node-uuid'),
  config = require('../../config');

const KEY_BITSIZE = 2048,
      CIPHER      = 'aes256';

const ISSUER = {
  country: 'FR',
  state: 'Ile de France',
  locality: 'Paris',
  organization: 'ContainerHQ',
  organizationUnit: 'IT',
  commonName: 'arkis.io',
  emailAddress: 'support@arkis.io'
};

const DEFAULT_OPTIONS = {
  keyBitsize: KEY_BITSIZE,
  hash: 'sha256',
  days: 3650,
  selfSigned: true
};

class Cert {
  static generate() {
    let certificate = {}, ca;

    return this._generateCA().then(generated => {
      ca = generated;
      certificate.ca = ca.certificate;
      return this._generateCert('server', { ca: ca });
    }).then(server => {
      certificate.server = server;
      return this._generateCert('client', { ca: ca });
    }).then(client => {
      certificate.client = client;
      return certificate;
    });
  }

  static _generateCert(type, { ca }) {
    return this._createPrivateKey({ cipher: false }).then(key => {
      return this._createCertificate({ type: type, key: key, ca: ca });
    }).then(cert => {
      return { cert: cert.certificate, key: cert.clientKey };
    });
  }

  static _generateCA() {
    return this._createPrivateKey({ cipher: true }).then(key => {
      return this._createCertificate({ type: 'ca', key: key });
    });
  }

  static _createPrivateKey({ cipher }) {
    return new Promise((resolve, reject) => {
      let options = { password: config.secrets.ssl };

      if (cipher) { _.merge(options, { cipher: CIPHER }); }

      pem.createPrivateKey(KEY_BITSIZE, options, (err, res) => {
        if (err) { return reject(err); }

        resolve(res.key);
      });
    });
  }

  static _createCertificate({ type, key, ca }) {
    return new Promise((resolve, reject) => {
      let options = _.merge({
        clientKey: key,
        clientKeyPassword: config.secrets.ssl,
      }, DEFAULT_OPTIONS);

      switch (type) {
        case 'ca':
          _.merge(options, ISSUER);
          break;
        case 'server':
          _.merge(options, { commonName: 'localhost',
            extFile: `./extfiles/server.cnf`
          });
          break;
        case 'client':
          _.merge(options, { commonName: 'client',
            extFile: `./extfiles/client.cnf`
          });
          break;
      }
      if (ca) {
        _.merge(options, {
          serviceKey: ca.serviceKey,
          serviceKeyPassword: config.secrets.ssl,
          serviceCertificate: ca.certificate,
          serial: uuid.v1()
        });
      }
      pem.createCertificate(options, (err, res) => {
        if (err) { return reject(err); }

        resolve(res);
      });
    });
  }
}

module.exports = Cert;
