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

    it('generates files with a secret passphrase', () => {
      let revert = SSH.__set__('keygen', (args, callback) => {
        revert();

        if (args.password === config.secrets.ssh) {
          return callback(null, { pubKey: '', key: '' });
        }
        callback(new Error('Invalid password binding.'));
      });
      return SSH.generateKey();
    });

    it('returns a key with public/private pair', () => {
      let sshKey = { pubKey: random.string(), key: random.string() },
        revert = SSH.__set__('keygen', (args, callback) => {
        revert();
        return callback(null, sshKey);
      });
      return SSH.generateKey().then(generatedKey => {
        return expect(generatedKey).to.deep.equal({
          public:  sshKey.pubKey,
          private: sshKey.key
        });
      });
    });

    context('afterGenerate', () => {
      let key;

      beforeEach(() => {
        return SSH.generateKey().then(generatedKey => {
          key = generatedKey;
        });
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
