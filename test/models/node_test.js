'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/routes/shared/errors'),
  machine = require('../support/machine'),
  concerns = require('./concerns');

describe('Node Model', () => {
  db.sync();

  /*
   * A non byon node has a default state set to 'deploying',
   * we must use a byon node wich has a default state set to
   * 'empty'.
   */
  concerns.behavesAsAStateMachine('byonNode', { default: 'deploying' });

  describe('validations', () => {
    /*
     * For this test we need to use a node with most of
     * the existing fields. Therefore, we are using a
     * registered node with a proper fqdn and public_ip.
     */
    it('succeeds with valid attributes', done => {
      factory.create('registeredNode', done);
    });

    it('succeeds to create multiple slave nodes for the same cluster', done => {
      factory.create('cluster', (err, cluster) => {
        factory.createMany('node', {
          master: false, cluster_id: cluster.id
        }, 3, done);
      });
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

    it('fails with multiple node with the same name', done => {
      factory.createMany('node', { name: 'test' }, 2, err => {
        expect(err).to.exist;
        done();
      });
    });

    it('fails with an invalid public_ip', () => {
      let node = factory.buildSync('node', { public_ip: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid master choice', () => {
      let node = factory.buildSync('node', { master: '' });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a null region and byon false', () => {
      let node = factory.buildSync('node', { byon: false, region: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a null node_size and byon false', () => {
      let node = factory.buildSync('node', { byon: false, node_size: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a region and byon true', () => {
      let node = factory.buildSync('node', { byon: true, node_size: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a node_size and byon true', () => {
      let node = factory.buildSync('node', { byon: true, region: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails when master is not unique for the same cluster', () => {
      let cluster = factory.buildSync('cluster'),
        opts = { master: true };

      return expect(cluster.save().then(() => {
        _.merge(opts, { cluster_id: cluster.id });
        return factory.buildSync('node', opts).save();
      }).then(() => {
        return factory.buildSync('node', opts).save();
      })).to.be.rejected;
    });
  });

  it('it is not a master node by default', () => {
    let node = factory.buildSync('node');

    return expect(node.save()).to.eventually.have.property('master', false);
  });

  context('#create', () => {
    const FQDN = 'node_01.node.arkis.io';

    let node, cluster;

    beforeEach(() => {
      cluster = { notify: sinon.stub() };
      node = factory.buildSync('node');
      node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
      sinon.stub(machine, 'generateFQDN').returns(FQDN);
      sinon.stub(machine, 'create', machine.create);
    });

    afterEach(() => {
      machine.generateFQDN.restore();
      machine.create.restore();
    });

    it('itinializes its fqdn', () => {
      return expect(node.save()).to.eventually.have.property('fqdn', FQDN);
    });

    it('initializes its jwt token', () => {
      return expect(node.save())
        .to.eventually.satisfy(has.validJWT);
    });

    it('generates its fqdn through machine', () => {
      return node.save().then(() => {
        return expect(machine.generateFQDN).to.have.been.calledWith({});
      });
    });

    it('it is initialized in deploying state', () => {
      return expect(node.save())
        .to.eventually.have.property('state', 'deploying');
    });

    it('creates a machine behind', () => {
      return node.save().then(() => {
        return expect(machine.create).to.have.been.calledWith({});
      });
    });

    it.skip('reports back its last_state to its cluster', () => {
      expect(cluster.notify)
        .to.have.been.calledWith({ last_state: node.last_state });
    });

    context('when byon node', () => {
      beforeEach(() => {
        _.merge(node, { byon: true, region: null, node_size: null });
      });

      it("doesn't create a machine behind", () => {
        return node.save().then(() => {
          return expect(machine.create).not.to.have.been.called;
        });
      });

      it('it is initialized in deploying state', () => {
        return expect(node.save())
          .to.eventually.have.property('state', 'deploying');
      });
    });
  });

  context('#update', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node');
      sinon.stub(machine, 'registerFQDN', machine.registerFQDN);
      return node.save();
    });

    afterEach(() => {
      machine.registerFQDN.restore();
    });

    context('when updating public_ip', () => {
      it('registers this ip for the fqdn', () => {
        return node.update({ public_ip: '192.168.1.90' }).then(() => {
          return expect(machine.registerFQDN)
            .to.have.been.calledWithMatch(_.pick(node, ['fqdn', 'public_ip']));
        });
      });
    });

    context('when not updating public_ip', () => {
      it("doesn't registers the public_ip for the fqdn", () => {
        return node.update({ name: 'test' }).then(() => {
          return expect(machine.registerFQDN).not.to.have.been.called;
        });
      })
    });

    context('when it belongs to a cluster', () => {
      let cluster;

      /*
       * We are using a fake cluster here, tests for cluster.notify behavior
       * belongs in the cluster model tests. Therefore we must only verify here
       * that our node model notify its cluster of its changes when it's
       * necessary.
       */
      beforeEach(() => {
          cluster = { notify: sinon.stub() };
          node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
      });

      context('when updating last_state', () => {
        /*
         * Be careful here, sequelize doesn't add a field in options.fields
         * if we are providing a value for the field equal to its prior value.
         */
        let opts = { last_state: 'upgrading' };

        beforeEach(() => {
          return node.update(opts);
        });

        it('reports back the new state to its cluster', () => {
          expect(cluster.notify).to.have.been.calledWith(opts);
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
  });

  context('#destroy', () => {
    let node, cluster;

    beforeEach(() => {
      cluster = { notify: sinon.stub() };
      node = factory.buildSync('node');
      node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
      sinon.stub(machine, 'destroy', machine.destroy);
      sinon.stub(machine, 'deleteFQDN', machine.deleteFQDN);
    });

    afterEach(() => {
      machine.destroy.restore();
      machine.deleteFQDN.restore();
    });

    context('with a non byon node', () => {
      beforeEach(() => {
        return node.save().then(() => {
          return node.destroy();
        });
      });

      it('reports back the deletion to its cluster', () => {
        expect(cluster.notify)
          .to.have.been.calledWith({ destroyed: true });
      });

      it('removes the machine behind', () => {
        expect(machine.destroy).to.have.been.calledWith({});
      });

      it('removes the fqdn', () => {
        expect(machine.deleteFQDN).to.have.been.calledWith(node.fqdn);
      });
    });

    context('with a byon node', () => {
      beforeEach(() => {
        _.merge(node, { byon: true, region: null, node_size: null });

        return node.save().then(() => {
          return node.destroy();
        });
      });

      it('reports back the deletion to its cluster', () => {
        expect(cluster.notify)
          .to.have.been.calledWith({ destroyed: true });
      });

      it("doesn't attempt to remove the machine behind", () => {
        expect(machine.destroy).to.not.have.been.called;
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
      node  = factory.buildSync('node');

      return node.save().then(node => {
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

  describe('#register', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node');
      return node.save();
    });

    it('updates the attributes', () => {
      let attributes = { public_ip: '192.168.0.1' };

      return expect(node.register(attributes))
        .to.eventually.include(attributes);
    });

    it('set the node state to running', () => {
      return expect(node.register())
        .to.eventually.have.property('state', 'running');
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
      const VERSIONS = { docker: '1.7.0', swarm: '0.3.0' };

      let node;

      beforeEach(() => {
        node = factory.buildSync('runningNode');

        return node.save().then(() => {
          return node.upgrade(VERSIONS);
        });
      });

      it('it is in upgrading state', () => {
        expect(node.state).to.equal('upgrading');
      });

      it('upgrades the machine behind', () => {
        expect(machine.upgrade).to.have.been.calledWith(VERSIONS);
      });
    });

    context('when node is not running', () => {
      let node, error;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save();
      });

      it('returns an error', () => {
        let expected = new errors.StateError('upgrade', node.state);

        return node.upgrade().then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(err => {
          expect(err).to.deep.equal(expected);
        });
      });

      it('has the same state than before', () => {
        return node.upgrade().then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(err => {
          return expect(node.reload())
            .to.eventually.have.property('state', 'deploying');
        });
      });

      it("doesn't update the machine behind", () => {
        return node.upgrade().then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(() => {
          expect(machine.upgrade).to.not.have.been.called;
        });
      });
    });

    context('when node already has the same version', () => {
      let node, versions, error;

      beforeEach(() => {
        node = factory.buildSync('runningNode');
        versions = { docker: node.docker_version, swarm: node.swarm_version };
        return node.save();
      });

      it('has the same state than before', () => {
        let previousState = node.state;

        return node.upgrade(versions).then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(() => {
          return expect(node.reload())
            .to.eventually.have.property('state', previousState);
        });
      });

      it("doesn't update the machine behind", () => {
        return node.upgrade(versions).then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(err => {
          return expect(err).to.deep.equal(new errors.AlreadyUpgradedError());
        });
      });
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
  });

  it('it is not a master node by default', () => {
    let node = factory.buildSync('node');

    return expect(node.save()).to.eventually.have.property('master', false);
  });
});
