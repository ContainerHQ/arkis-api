'use strict';

let _ = require('lodash'),
  validator = require('validator'),
  config = require('../../../config'),
  errors = require('../../../app/support').errors,
  SSH = require('../../../app/connectors/ssh'),
  Machine = require('../../../app/connectors/machine');

const IMAGE_NAME = 'ubuntu-14-04-x64',
      UNPROCESSABLE_MESSAGE =
      'You specified an invalid region for machine creation.',
      SSH_PREFIX = `${config.project || '.'}-`;

describe('Machine DigitalOcean Connector', () => {
  context('with valid credentials', () => {
    let client;

    beforeEach(() => {
      client = Machine.default(config.auth.machine);
    });

    describe('#verifyCredentials', () => {
      it('is fulfilled', () => {
        return expect(client.verifyCredentials()).to.be.fulfilled;
      });
    });

    describe('#getRegions', () => {
      it('returns the formated regions list', () => {
        return expect(client.getRegions())
          .to.eventually.satisfy(has.formatedRegions)
      });
    });

    describe('#getSizes', () => {
      it('returns the formated sizes list', () => {
        return expect(client.getSizes())
          .to.eventually.satisfy(has.formatedSizes);
      });
    });

    describe('#create', () => {
      let publicKey;

      beforeEach(() => {
        return SSH.generateKey().then(key => {
          publicKey = key.public;
        });
      });

      afterEach(() => {
        return client.getSSHKey(publicKey).then(key => {
          return new Promise((resolve, reject) => {
            client._client.accountDeleteKey(key.fingerprint, err => {
              if (err) { return reject(err); }

              resolve();
            });
          });
        });
      });

      /*
       * DigitalOcean doesn't provide a test api, beside we can't delete a
       * droplet in deploying state, therefore we are faking the call to the
       * real API to avoid to create real resources that would be difficult
       * to remove.
       */
      context('with valid options', () => {
        const SUCCESS = { statusCode: 202 };

        let opts, body, dropletId;

        beforeEach(() => {
          opts = {
            name: random.string(),
            region: random.string(),
            size: random.string()
          };
          body = { droplet: { id: random.string() } };

          client._client.dropletsCreate = sinon.stub()
            .yields(null, SUCCESS, body);

          return client.create(opts, publicKey).then(id => {
            dropletId = id;
          });
        });

        it('creates a machine with given options and ssh public key', () => {
          return client.getSSHKey(publicKey).then(key => {
            _.merge(opts, {
              image: IMAGE_NAME,
              ssh_keys: [key.fingerprint]
            });
            return expect(client._client.dropletsCreate)
              .to.have.been.calledWith(opts);
          });
        });

        it('returns the droplet id', () => {
          expect(dropletId).to.equal(body.droplet.id);
        });
      });

      context('with invalid options', () => {
        it('returns an error', done => {
          client.create({}, publicKey).then(done).catch(err => {
            expect(err).to.deep.equal(
              new errors.MachineUnprocessableError(UNPROCESSABLE_MESSAGE)
            );
          }).then(done).catch(done);
        });
      });
    });

    describe('#delete', () => {
      /*
       * DigitalOcean doesn't provide a test api, beside we can't delete a
       * droplet in deploying state, therefore we are faking the call to the
       * real API.
       */
      context('with valid id', () => {
        const ID = random.string(), SUCCESS = { statusCode: 200 };

        beforeEach(() => {
          client._client.dropletsDelete = sinon.stub().yields(null, SUCCESS);
          return client.delete(ID);
        });

        it('deletes the droplet with the given id', () => {
          expect(client._client.dropletsDelete).to.have.been.calledWith(ID);
        });
      });

      context('with invalid id', () => {
        it('returns an error', done => {
          client.delete({}).then(done).catch(err => {
            expect(err).to.deep.equal(new errors.MachineNotFoundError());
          }).then(done).catch(done);
        });
      });
    });

    describe('#getSSHKey', () => {
      let sshKey, fingerprint;

      beforeEach(() => {
        return SSH.generateKey().then(key => {
          sshKey = key;
        });
      });

      afterEach(done => {
        client._client.accountDeleteKey(fingerprint, done);
      });

      context('when ssh key already exists', () => {
        beforeEach(done => {
          client._client.accountAddKey({
            name: random.string(),
            public_key: sshKey.public
          }, (err, res, body) => {
            fingerprint = body.ssh_key.fingerprint;
            done(err);
          });
        });

        it('retrieves the specified ssh key', () => {
          return client.getSSHKey(sshKey.public).then(key => {
            expect(key.fingerprint).to.equal(fingerprint);
          });
        });
      });

      context("when ssh key doesn't exist", () => {
        it('creates and returns a new ssh key', () => {
          return client.getSSHKey(sshKey.public).then(key => {
            fingerprint = key.fingerprint;

            expect(key.name).to.startWith(SSH_PREFIX);
            expect(key.name.replace(SSH_PREFIX, ''))
              .to.satisfy(validator.isUUID);
          });
        });
      });
    });
  });

  context('with invalid credentials', () => {
    let client;

    beforeEach(() => {
      client = Machine.default();
    });

    describe('#verifyCredentials', () => {
      it('returns an error', done => {
        client.verifyCredentials().then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
        }).then(done).catch(done);
      });
    });

    describe('#getRegions', () => {
      it('returns an empty list', () => {
        return expect(client.getRegions()).to.eventually.be.empty;
      });
    });

    describe('#getSizes', () => {
      it('returns an empty list', () => {
        return expect(client.getSizes()).to.eventually.be.empty;
      });
    });

    describe('#create', () => {
      it('returns an error', done => {
        client.create({}, '.').then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
        }).then(done).catch(done);
      });
    });

    describe('#delete', () => {
      it('returns an error', done => {
        client.delete({}).then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
        }).then(done).catch(done);
      });
    });

    describe('#getSSHKey', () => {
      it('returns an error', done => {
        client.getSSHKey('.').then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
        }).then(done).catch(done);
      });
    });
  });
});
