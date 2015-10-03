'use strict';

let _ = require('lodash'),
  fs = require('fs'),
  validator = require('validator'),
  config = require('../../config'),
  SSH = rewire('../../app/connectors/ssh');

const TEMP_PREFIX = '/tmp/ssh-';

describe('SSH Connector', () => {
  describe('.generateKey', () => {
    it('generate files in a unique temporary location', () => {
      let previousFileId = null;

      let revert = SSH.__set__('keygen', (args, callback) => {
        revert();

        if (args.location.startsWith(TEMP_PREFIX)) {
          let fileId = args.location.replace(TEMP_PREFIX, '');

          if (validator.isUUID(fileId) && fileId !== previousFileId) {
            previousFileId = fileId;

            return callback(null, { pubKey: '', key: '' });
          }
        }
        callback(new Error('Invalid temporary location.'));
      });
      return SSH.generateKey().then(() => {
        return SSH.generateKey();
      });
    });

    context('afterGenerate', () => {
      let key;

      beforeEach(() => {
        return SSH.generateKey().then(generatedKey => {
          key = generatedKey;
        });
      });

      it.skip('returns a valid ssh key pair', () => {
      });

      it.skip('key pair is signed with secret passphrase', () => {

      });

      it('destroys the generated temp files', () => {
        let filenames = fs.readdirSync('/tmp');

        expect(_.all(filenames, filename => {
          return !filename.startsWith('ssh-');
        })).to.be.true;
      });

      it('public key has domain as comment', () => {
        let expectedEnd = `${config.domain || '.'}`;

        expect(key.public).to.endWith(expectedEnd);
      });
    });

  });
});
