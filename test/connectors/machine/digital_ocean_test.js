'use strict';

let _ = require('lodash'),
  config = require('../../../config'),
  errors = require('../../../app/support').errors,
  Machine = require('../../../app/connectors/machine');

const IMAGE_NAME = 'ubuntu-14-04-x64',
      UNPROCESSABLE_MESSAGE =
      'You specified an invalid region for machine creation.';

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
          return client.create(OPTIONS).then(id => {
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
          client.create({}).then(done).catch(err => {
            expect(err).to.deep.equal(
              new errors.MachineUnprocessableError(UNPROCESSABLE_MESSAGE)
            );
            done();
          });
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
            done();
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

    describe('#create', () => {
      it('returns an error', done => {
        client.create({}).then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
          done();
        });
      });
    });

    describe('#delete', () => {
      it('returns an error', done => {
        client.delete({}).then(done).catch(err => {
          expect(err).to.deep.equal(new errors.MachineCredentialsError());
          done();
        });
      });
    });
  });
});
