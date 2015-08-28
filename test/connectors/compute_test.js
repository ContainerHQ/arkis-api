'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  errors = require('../../app/support').errors,
  Compute = require('../../app/connectors/compute');

const IMAGE_NAME = 'ubuntu-14-04-x64';

describe('Compute DigitalOcean Connector', () => {
  context('with valid credentials', () => {
    let client;

    beforeEach(() => {
      client = Compute.default(config.auth.compute);
    });

    describe('#verifyCredentials', () => {
      it('is fulfilled', () => {
        return expect(client.verifyCredentials()).to.be.fulfilled;
      });
    });

    describe('#getRegions', () => {
      it('returns the regions list', () => {
        return expect(client.getRegions()).to.eventually.not.be.empty;
      });
    });

    describe('#getSizes', () => {
      it('returns the sizes list', () => {
        return expect(client.getSizes()).to.eventually.not.be.empty;
      });
    });

    describe('#createMachine', () => {
      /*
       * DigitalOcean doesn't provide a test api, beside we can't delete a
       * droplet in deploying state, therefore we are faking the call to the
       * real API to avoid to create real ressources that would be difficult
       * to remove.
       */
      context('with valid options', () => {
        const OPTIONS = {
          name: random.string(),
          region: random.string(),
          size: random.string()
        },
          SUCCESS = { statusCode: 202 },
          BODY = { droplet: { id: random.string() } };

        let dropletId;

        beforeEach(() => {
          client._client.dropletsCreate = sinon.stub().yields(null, SUCCESS, BODY);
          return client.createMachine(OPTIONS).then(id => {
            dropletId = id;
          });
        });

        it('creates a machine with given options', () => {
          let opts = _.merge({ image: IMAGE_NAME }, OPTIONS);

          expect(client._client.dropletsCreate).to.have.been.calledWith(opts);
        });

        it('returns the droplet id', () => {
          expect(dropletId).to.equal(BODY.droplet.id);
        });
      });

      context('with invalid options', () => {
        it('returns an error', done => {
          client.createMachine({}).then(done).catch(err => {
            expect(err).to.deep.equal(new errors.MachineInvalidError());
            done();
          });
        });
      });
    });

    describe('#deleteMachine', () => {
      /*
       * DigitalOcean doesn't provide a test api, beside we can't delete a
       * droplet in deploying state, therefore we are faking the call to the
       * real API.
       */
      context('with valid id', () => {
        const ID = random.string(), SUCCESS = { statusCode: 200 };

        beforeEach(() => {
          client._client.dropletsDelete = sinon.stub().yields(null, SUCCESS);
          return client.deleteMachine(ID);
        });

        it('deletes the droplet with the given id', () => {
          expect(client._client.dropletsDelete).to.have.been.calledWith(ID);
        });
      });

      context('with invalid id', () => {
        it('returns an error', done => {
          client.deleteMachine({}).then(done).catch(err => {
            expect(err).to.deep.equal(new errors.MachineNotFoundError());
            done();
          });
        });
      });
    });
  });

  context('with invalid credentials', () => {
    let client;

    beforeEach(() => {
      client = Compute.default();
    });

    describe('#verifyCredentials', () => {
      it('is rejected', done => {
        client.verifyCredentials().then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
          done();
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

    describe('#createMachine', () => {
      it('returns an error', done => {
        client.createMachine({}).then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
          done();
        });
      });
    });

    describe('#deleteMachine', () => {
      it('returns an error', done => {
        client.deleteMachine({}).then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
          done();
        });
      });
    });
  });
});
