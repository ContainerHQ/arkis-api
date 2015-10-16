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
            size: random.string(),
            ssh_keys: [random.uuid()]
          };
          body = { droplet: { id: random.string() } };

          client._client.dropletsCreate = sinon.stub()
            .yields(null, SUCCESS, body);

          return client.create(opts).then(id => {
            dropletId = id;
          });
        });

        it('creates a machine with given options', () => {
          _.merge(opts, { image: IMAGE_NAME });

          return expect(client._client.dropletsCreate)
            .to.have.been.calledWith(opts);
        });

        it('returns the droplet id', () => {
          expect(dropletId).to.equal(body.droplet.id);
        });
      });

      context('with invalid options', () => {
        it('returns an error', done => {
          client.create({}).then(done).catch(err => {
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

    describe('#addKey', () => {
      context('with valid public key', () => {
        let sshKey, keyId;

        beforeEach(() => {
          return SSH.generateKey().then(key => {
            sshKey = key;
          });
        });

        afterEach(done => {
          client._client.accountDeleteKey(keyId, done);
        });

        it('creates and returns a new ssh key id', done => {
          client.addKey(sshKey.public).then(id => {
            keyId = id;

            client._client.accountGetKeyById(id, (err, res, body) => {
              if (err) { return done(err); }

              expect(body.ssh_key.name).to.startWith(SSH_PREFIX);
              expect(body.ssh_key.name.replace(SSH_PREFIX, '')).to.satisfy(
                validator.isUUID
              );
              done();
            });
          }).catch(done);
        });
      });

      context('with invalid public key', () => {
        it('returns an error', () => {
          return expect(client.addKey()).to.be.rejected;
        });
      });
    });

    describe('#removeKey', () => {
      context('when the specified key exists', () => {
        let keyId;

        beforeEach(() => {
          return SSH.generateKey().then(key => {
            return client.addKey(key.public);
          }).then(id => {
            keyId = id;
          });
        });

        it('removes the key', done => {
          client.removeKey(keyId).then(() => {
            client._client.accountGetKeyById(keyId, (err, res, body) => {
              if (err) { return done(err); }

              expect(res.statusCode).to.equal(404);
              done();
            });
          }).catch(done);
        });
      });

      context('whith invalid id', () => {
        it('returns an error', done => {
          client.removeKey().then(done).catch(err => {
            expect(err).to.deep.equal(new errors.MachineNotFoundError());
          }).then(done).catch(done);
        });
      });
    });
  });

  context('with invalid credentials', () => {
    let client;

    beforeEach(() => {
      client = Machine.default();
    });

    [
      'verifyCredentials', 'create', 'delete', 'addKey', 'removeKey'
    ].forEach(method => {
      describe(`#${method}`, () => {
        it('returns an error', done => {
          client[method]({}).then(done).catch(err => {
            expect(err).to.deep.equal(new errors.MachineCredentialsError());
          }).then(done).catch(done);
        });
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
  });
});
