'use strict';

let _ = require('lodash'),
  errors = require('../../app/support').errors,
  compute = require('../../app/tools/compute');

describe('DigitalOcean Compute Client', () => {
  const UNAUTHORIZED_ERROR = new errors.ProviderError({
    provider: 'DigitalOcean',
    statusCode: 401,
    statusMessage: 'Unauthorized',
    message: 'Unable to authenticate you.'
  });

  const UNPROCESSABLE_ERROR = new errors.ProviderError({
    provider: 'DigitalOcean',
    statusCode: 422,
    statusMessage: 'Unprocessable Entity',
    message: 'You specified an invalid region for Droplet creation.'
  });

  const NOT_FOUND_ERROR = new errors.ProviderError({
    provider: 'DigitalOcean',
    statusCode: 404,
    statusMessage: 'Not Found',
    message: 'The resource you were accessing could not be found.'
  });

  context('with valid credentials', () => {
    let client;

    beforeEach(() => {
      client = compute.getClient('digitalocean', {
        token: 'd9e29fac4796f05d6cf6c2eadf642eaef2ef3b804dcd0d5fb63d43161a913726'
      });
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
      context('with valid options', () => {
        let options;

        beforeEach(() => {
          options = { id: random.string() };

          return client.getRegions().then(regions => {
            options.region    = _.first(regions, { available: true }).slug;
            options.node_size = '512mb';
          });
        });

        it('creates a machine with given options', () => {
          let id;

          return client.createMachine(options).then(machine => {
            id = machine.id;
            return expect(machine).to.exist;
          }).then(() => {
            return client.deleteMachine(id);
          });
        });
      });

      context('with invalid options', () => {
        it('returns an error', done => {
          client.createMachine({}).then(done).catch(err => {
            expect(err).to.deep.equal(UNPROCESSABLE_ERROR);
            done();
          });
        });
      });
    });

    describe('#deleteMachine', () => {
      context('with invalid id', () => {
        it('returns an error', done => {
          client.deleteMachine({}).then(done).catch(err => {
            expect(err).to.deep.equal(NOT_FOUND_ERROR);
            done();
          });
        });
      });
    });
  });

  context('with invalid credentials', () => {
    let client;

    beforeEach(() => {
      client = compute.getClient('digitalocean', {});
    });

    describe('#verifyCredentials', () => {
      it('is rejected', done => {
        client.verifyCredentials().then(done).catch(err => {
          expect(err).to.deep.equal(UNAUTHORIZED_ERROR);
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
          expect(err).to.deep.equal(UNAUTHORIZED_ERROR);
          done();
        });
      });
    });

    describe('#deleteMachine', () => {
      it('returns an error', done => {
        client.deleteMachine({}).then(done).catch(err => {
          expect(err).to.deep.equal(UNAUTHORIZED_ERROR);
          done();
        });
      });
    });
  });
});
