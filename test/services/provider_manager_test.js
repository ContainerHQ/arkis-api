'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  models = require('../../app/models'),
  services = require('../../app/services');

describe('ProviderManager Service', () => {
  let manager;

  beforeEach(() => {
    return factory.buildSync('user').save().then(user => {
      manager = new services.ProviderManager(user);
    });
  });

  describe('.constructor', () => {
    it('initializes machine with config credentials', () => {
      expect(manager.machine.credentials).to.equal(config.auth.machine);
    });
  });

  describe('#link', () => {
    context('when machine.addKey succeeded', () => {
      let providerId;

      beforeEach(() => {
        providerId = random.uuid();
        manager.machine.addKey = sinon.stub().returns(
          Promise.resolve(providerId)
        );
        return manager.link();
      });

      it('registers the user ssh public key', () => {
        expect(manager.machine.addKey)
          .to.have.been.calledWith(manager.user.ssh_key.public);
      });

      it('creates a links to the ssh key provider id', () => {
        return expect(manager.user.getUserProviderLinks({
          where: { type: 'ssh_key', provider_id: providerId }
        })).to.eventually.not.be.empty;
      });
    });

    context('when machine.addKey failed', () => {
      let expectedErr;

      beforeEach(() => {
        expectedErr = random.error();
        manager.machine.addKey = sinon.stub().returns(
          Promise.reject(expectedErr)
        );
      });

      it('returns the error', () => {
        return expect(manager.link()).to.be.rejectedWith(expectedErr);
      });
    });
  });

  describe('#unlink', ()=> {
    let sshKeyLink;

    beforeEach(() => {
      return manager.link().then(() => {
        return manager.user.getUserProviderLinks({
          where: { type: 'ssh_key' }
        });
      }).then(_.first).then(link => {
        sshKeyLink = link;
      });
    });

    context('when machine.removeKey succeeded', () => {
      beforeEach(() => {
        manager.machine.removeKey = sinon.stub().returns(Promise.resolve());
        return manager.unlink();
      });

      it('removes the ssh key from the provider', () => {
        expect(manager.machine.removeKey)
          .to.have.been.calledWith(sshKeyLink.provider_id);
      });

      it('removes the link to the ssh key provider id', () => {
        return expect(models.UserProviderLink.findById(sshKeyLink.id))
          .to.eventually.not.exist;
      });
    });

    context('when machine.removeKey failed', done => {
      let actualErr, expectedErr;

      beforeEach(done => {
        expectedErr = random.error();
        manager.machine.removeKey = sinon.stub().returns(
          Promise.reject(expectedErr)
        );
        manager.unlink().then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it("doesn't remove the link to the ssh key provider id", () => {
        return expect(models.UserProviderLink.findById(sshKeyLink.id))
          .to.eventually.exist;
      });

      it('returns the error', () => {
        expect(actualErr).to.deep.equal(expectedErr);
      });
    });
  });
});
