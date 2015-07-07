'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/routes/shared/errors'),
  machine = require('../support/machine'),
  concerns = require('./concerns');

describe('Node Model', () => {
  db.sync();

  concerns.behavesAsAStateMachine('node');

  describe('validations', () => {
    /*
     * For this test we need to use a node with most of
     * the existing fields. Therefore, we are using a
     * registered node with a proper fqdn and public_ip.
     */
    it('succeeds with valid attributes', done => {
      factory.create('registeredNode', done);
    });

    it('fails without a name', () => {
      let node = factory.buildSync('node', { name: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an empty name', () => {
      let node = factory.buildSync('node', { name: '' });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a too long name', () => {
      let node = factory.buildSync('node', { name: _.repeat('*', 65) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid fqdn', () => {
      let node = factory.buildSync('node', { fqdn: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid public_ip', () => {
      let node = factory.buildSync('node', { public_ip: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid master choice', () => {
      let node = factory.buildSync('node', { master: '' });

      return expect(node.save()).to.be.rejected;
    });
  });

  it('it is not a master node by default', () => {
    let node = factory.buildSync('node');

    return expect(node.save()).to.eventually.have.property('master', false);
  });

  context('when it belongs to a cluster', () => {
    let node, cluster;

    /*
     * We are using a fake cluster here, tests for cluster.notify behavior
     * belongs in the cluster model tests. Therefore we must only verify here
     * that our node model notify its cluster of its changes when it's
     * necessary.
     */
    beforeEach(() => {
        cluster = { notify: sinon.stub() };
        node = factory.buildSync('node');
        node.getCluster = sinon.stub().returns(new Promise(resolve => {
          resolve(cluster);
        }));
        return node.save();
    });

    context('when switching state', () => {
      let opts = { last_state: 'deploying' };

      beforeEach(() => {
        return node.update(opts);
      });

      it('reports back the new state to its cluster', () => {
        expect(cluster.notify).to.have.been.calledWith(opts);
      });
    });

    context('afterDestroy', () => {
      beforeEach(() => {
        sinon.stub(machine, 'destroy', machine.destroy);

        return node.deploy().then(() => {
          return node.destroy();
        });
      });

      afterEach(() => {
        machine.destroy.restore();
      });

      it('reports back the deletion to its cluster', () => {
        expect(cluster.notify)
          .to.have.been.calledWith({ destroyed: true });
      });

      it('removes the machine behind', () => {
        expect(machine.destroy).to.have.been.calledWith({});
      });
    });

    context('when updating last_ping', () => {
      context('when slave node', () => {
        beforeEach(() => {
          return node.update({ master: false, last_ping: Date.now() });
        });

        it("doesn't report back the ping to its cluster", () => {
          expect(cluster.notify).to.not.have.been.called;
        });
      });
      context('when master node', () => {
        beforeEach(() => {
          return node.update({ master: true, last_ping: Date.now() });
        });

        it('reports back the ping to its cluster', () => {
          expect(cluster.notify)
            .to.have.been.calledWith({ last_ping: node.last_ping });
        });
      });
    });

    context('when updating a field different than last fields', () => {
      beforeEach(() => {
        return node.update({ public_ip: '127.0.0.1' });
      });

      it("doesn't notify its cluster", () => {
        expect(cluster.notify).to.not.have.been.called;
      });
    });
  });

  describe('#ping', () => {
    let node, clock;

    /*
     * We are faking the time and increasing it a bit here to ensure that
     * last_ping is properly set to the current date and time.
     */
    beforeEach(() => {
      clock = sinon.useFakeTimers();

      node = factory.buildSync('node');
      return node.save().then(node => {
        node.notifyCluster = sinon.stub();
        clock.tick(500);
        return node.ping();
      });
    });

    afterEach(() => {
      clock.restore();
    });

    it('updates its last_ping', () => {
      return expect(node.last_ping).to.deep.equal(moment().toDate());
    });
  });

  describe('#deploy', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node');
      sinon.stub(machine, 'create', machine.create);
      return node.deploy();
    });

    afterEach(() => {
      machine.create.restore();
    });

    it('it is in deploying state', () => {
      expect(node.state).to.equal('deploying');
    });

    it('creates a machine behind', () => {
      expect(machine.create).to.have.been.calledWith({});
    });
  });

  describe('#register', () => {
    let node, fqdn, options;

    beforeEach(() => {
      node = factory.buildSync('node', { public_ip: '127.0.0.1' });
      fqdn = `${node.name}.node.arkis.io`;

      sinon.stub(machine, 'registerFQDN').returns(new Promise(resolve => {
        resolve(fqdn);
      }));
      return node.register();
    });

    afterEach(() => {
      machine.registerFQDN.restore();
    });

    it('it is in deploying state', () => {
      expect(node.state).to.equal('running');
    });

    it('registers a fqdn for the node public_ip', () => {
      expect(machine.registerFQDN).to.have.been.calledWith(node.public_ip);
    });

    it('has a fqdn equal to the registered fqdn', () => {
      expect(node.fqdn).to.equal(fqdn);
    });
  });

  describe('#upgrade', () => {
    let node;

    beforeEach(() => {
      sinon.stub(machine, 'upgrade', machine.upgrade);
    });

    afterEach(() => {
      machine.upgrade.restore();
    });

    context('when node is running', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node', {
          last_state: 'running',
          last_ping: Date.now()
        });

        node._notifyCluster = sinon.stub();
        return node.save().then(() => {
          return node.upgrade();
        });
      });

      it('it is in upgrading state', () => {
        expect(node.state).to.equal('upgrading');
      });

      it('upgrades the machine behind', () => {
        expect(machine.upgrade).to.have.been.calledWith({});
      });
    });

    context('when node is not running', () => {
      let node, error;

      beforeEach(done => {
        node = factory.buildSync('node');
        node._notifyCluster = sinon.stub();

        return node.save().then(() => {
          return node.upgrade();
        }).then(done).catch(err => {
          error = err;
          done();
        });
      });

      /*
       * This should return a proper error
       */
      it('returns an error', () => {
        let expected = new errors.StateError('upgrade', node.state);

        expect(error).to.deep.equal(expected);
      });

      it('has the same state than before', () => {
        expect(node.state).to.equal('empty');
      });

      it("doesn't update the machine behind", () => {
        expect(machine.upgrade).to.not.have.been.called;
      });
    });
  });
});
