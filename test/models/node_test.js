'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/routes/shared/errors'),
  machine = require('../support/machine'),
  concerns = require('./concerns'),
  config = require('../../config'),
  Node = require('../../app/models').Node;

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

    it('succeeds with minimal attributes', done => {
      factory.create('node', done);
    });

    it('succeeds to create multiple slave nodes for the same cluster', done => {
      factory.create('cluster', (err, cluster) => {
        factory.createMany('node', {
          master: false, cluster_id: cluster.id
        }, 3, done);
      });
    });

    it('succeeds with the same name on different clusters', () => {
      let cluster1 = factory.buildSync('cluster'),
        cluster2 = factory.buildSync('cluster');

      return expect(cluster1.save().then(() => {
        return factory.buildSync('node', { cluster_id: cluster1.id }).save();
      }).then(() => {
        return cluster2.save();
      }).then(() => {
        return factory.buildSync('node', { cluster_id: cluster2.id }).save();
      })).to.be.fulfilled;
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

    context('when in the same cluster', () => {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('cluster');
        return cluster.save();
      });

      it('fails with multiple node with the same name', done => {
        let opts = { name: 'test', cluster_id: cluster.id };

        factory.createMany('node', opts, 2, err => {
          expect(err).to.exist;
          done();
        });
      });
    });

    it('fails with an invalid fqdn', () => {
      let node = factory.buildSync('node', { fqdn: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid public_ip', () => {
      let node = factory.buildSync('node', { public_ip: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails when public_ip already exists', done => {
      factory.createMany('node', { public_ip: '127.0.0.1' }, 2, err => {
        expect(err).to.exist;
        done();
      });
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

    it('fails with min cpu', () => {
      let node = factory.buildSync('node', { cpu: 0 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with min memory', () => {
      let node = factory.buildSync('node', { memory: 127 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with min disk', () => {
      let node = factory.buildSync('node', { disk: 0.9999 });

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

  describe('#create', () => {
    const FQDN = 'node_01.node.arkis.io';

    let node, cluster;

    beforeEach(() => {
      cluster = { notify: sinon.stub() };
      node = factory.buildSync('node');
      node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
    });

    context('when machine creation succeeded', () => {
      beforeEach(() => {
        sinon.stub(machine, 'generateFQDN').returns(FQDN);
        sinon.stub(machine, 'create', machine.create);
      });

      afterEach(() => {
        machine.generateFQDN.restore();
        machine.create.restore();
      });

      it('is not a master node by default', () => {
        let node = factory.buildSync('node');

        return expect(node.save()).to.eventually.have.property('master', false);
      });

      it('initializes its fqdn', () => {
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

      it('initialized its state to deploying', () => {
        return expect(node.save())
          .to.eventually.have.property('state', 'deploying');
      });

      it('creates a machine behind', () => {
        return node.save().then(() => {
          return expect(machine.create).to.have.been.calledWith({});
        });
      });

      it('reports back its last_state to its cluster', () => {
        return node.save().then(() => {
          return expect(cluster.notify)
            .to.have.been.calledWith({ last_state: node.last_state });
        });
      });

      it('has no download link to get the agent', () => {
        return expect(node.save())
          .to.eventually.have.property('agent_cmd', null);
      });
    });

    context('when machine creation failed', () => {
      beforeEach(() => {
        sinon.stub(machine, 'create').returns(Promise.reject());
      });

      afterEach(() => {
        machine.create.restore();
      });

      it("doesn't save the node", done => {
        node.save().then(done).catch(err => {
          expect(Node.findById(node.id))
            .to.eventually.not.exist
            .notify(done);
        });
      });
    });

    context('when byon node', () => {
      const AGENT_CMD = random.string();

      beforeEach(() => {
        _.merge(node, { byon: true, region: null, node_size: null });
        sinon.stub(machine, 'agentCmd').returns(AGENT_CMD);
        sinon.stub(machine, 'create', machine.create);
      });

      afterEach(() => {
        machine.agentCmd.restore();
        machine.create.restore();
      });

      it("doesn't create a machine behind", () => {
        return node.save().then(() => {
          return expect(machine.create).not.to.have.been.called;
        });
      });

      it('initialized its state to deploying', () => {
        return expect(node.save())
          .to.eventually.have.property('state', 'deploying');
      });

      it('uses machine to get the command to install the agent', () => {
        return node.save().then(() => {
          return node.toJSON();
        }).then(() => {
          return expect(machine.agentCmd).to.have.been.calledWith(node.token);
        });
      });

      it('has a command to get the agent', () => {
        return expect(node.save())
          .to.eventually.have.property('agent_cmd', AGENT_CMD);
      });
    });
  });

  describe('#update', () => {
    context('when updating public_ip', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save();
      });

      afterEach(() => {
        machine.registerFQDN.restore();
      });

      context('when machine fqdn registration succeeded', () => {
        beforeEach(() => {
          sinon.stub(machine, 'registerFQDN', machine.registerFQDN);
        });

        it('registers this ip for the fqdn', () => {
          return node.update({ public_ip: '192.168.1.90' }).then(() => {
            return expect(machine.registerFQDN)
              .to.have.been
              .calledWithMatch(_.pick(node, ['fqdn', 'public_ip']));
          });
        });
      });

      context('when machine fqdn registration failed', () => {
        beforeEach(() => {
          sinon.stub(machine, 'registerFQDN').returns(Promise.reject());
        });

        it("doesn't update the node", done => {
          let opts = { public_ip: '192.168.1.90' };

          return node.update(opts).then(done).catch(err => {
            expect(node.reload())
              .to.eventually.not.have.property('public_ip', opts.public_ip)
              .notify(done);
          });
        });
      });
    });

    context('when not updating public_ip', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save();
      });

      beforeEach(() => {
        sinon.stub(machine, 'registerFQDN', machine.registerFQDN);
      });

      afterEach(() => {
        machine.registerFQDN.restore();
      });

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
      });

      context('when updating master', () => {
        context('with true', () => {
          let node;

          beforeEach(() => {
            node = factory.buildSync('node', { master: false });
            return node.save().then(() => {
              node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
            });
          });

          beforeEach(() => {
            return node.update({ master: true });
          });

          it('reports back its last ping to its cluster', () => {
            expect(cluster.notify)
              .to.have.been.calledWith({ last_ping: node.last_ping });
          });
        });

        context('with false', () => {
          let node;

          beforeEach(() => {
            node = factory.buildSync('node', { master: true });
            return node.save().then(() => {
              node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
            });
          });

          beforeEach(() => {
            return node.update({ master: false });
          });

          it('reports back its downgrade its cluster', () => {
            expect(cluster.notify)
              .to.have.been.calledWith({ last_ping: null });
          });
        });
      });

      context('when updating last_state', () => {
        let node;

        beforeEach(() => {
          node = factory.buildSync('node');
          return node.save().then(() => {
            node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
          });
        });

        /*
         * Be careful here, sequelize doesn't add a field in options.fields
         * if we are providing a value for the field equal to its prior value.
         */
        const OPTS = { last_state: 'upgrading' };

        beforeEach(() => {
          return node.update(OPTS);
        });

        it('reports back the new state to its cluster', () => {
          expect(cluster.notify).to.have.been.calledWith(OPTS);
        });
      });

      context('when updating last_ping', () => {
        context('when slave node', () => {
          let node;

          beforeEach(() => {
            node = factory.buildSync('node', { master: false });
            return node.save().then(() => {
              node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
            });;
          });

          beforeEach(() => {
            return node.update({ last_ping: Date.now() });
          });

          it("doesn't report back the ping to its cluster", () => {
            expect(cluster.notify).to.not.have.been.called;
          });
        });

        context('when master node', () => {
          let node;

          beforeEach(() => {
            node = factory.buildSync('node', { master: true });
            return node.save().then(() => {
              node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
            });;
          });

          beforeEach(() => {
            return node.update({ last_ping: Date.now() });
          });

          it('reports back the ping to its cluster', () => {
            expect(cluster.notify)
              .to.have.been.calledWith({ last_ping: node.last_ping });
          });
        });
      });

      context('when updating a field different than last fields', () => {
        let node;

        beforeEach(() => {
          node = factory.buildSync('node');
          return node.save().then(() => {
            node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
          });
        });

        beforeEach(() => {
          return node.update({ public_ip: '127.0.0.1' });
        });

        it("doesn't notify its cluster", () => {
          expect(cluster.notify).to.not.have.been.called;
        });
      });
    });
  });

  describe('#destroy', () => {
    let node, cluster;

    beforeEach(() => {
      cluster = { notify: sinon.stub() };
      node = factory.buildSync('node');
    });

    context('with a non byon node', () => {
      beforeEach(() => {
        return node.save().then(() => {
          node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
        });
      });

      context('when machine destruction and fqdn deletion succeeds', () => {
        beforeEach(() => {
          sinon.stub(machine, 'destroy', machine.destroy);
          sinon.stub(machine, 'deleteFQDN', machine.deleteFQDN);
          return node.destroy();
        });

        afterEach(() => {
          machine.destroy.restore();
          machine.deleteFQDN.restore();
        });

        it('reports back the deletion to its cluster', () => {
          expect(cluster.notify)
            .to.have.been.calledWith({ last_state: 'destroyed', master: false });
        });

        it('removes the machine behind', () => {
          expect(machine.destroy).to.have.been.calledWith({});
        });

        it('removes the fqdn', () => {
          expect(machine.deleteFQDN).to.have.been.calledWith(node.fqdn);
        });
      });

      context('when machine destruction failed', () => {
        beforeEach(() => {
          sinon.stub(machine, 'destroy').returns(Promise.reject());
          sinon.stub(machine, 'deleteFQDN', machine.deleteFQDN);
        });

        afterEach(() => {
          machine.destroy.restore();
          machine.deleteFQDN.restore();
        });

        it("doesn't delete the fqdn", done => {
          node.destroy().then(done).catch(err => {
            expect(machine.deleteFQDN).to.not.have.been.called;
            done();
          });
        });

        it("doesn't delete the node", done => {
          node.destroy().then(done).catch(err => {
            expect(Node.findById(node.id))
              .to.eventually.exist
              .notify(done);
          });
        });
      });

      context('when machine fqdn deletion failed', () => {
        beforeEach(() => {
          sinon.stub(machine, 'deleteFQDN').returns(Promise.reject());
        });

        afterEach(() => {
          machine.deleteFQDN.restore();
        });

        it("doesn't delete the node", done => {
          node.destroy().then(done).catch(err => {
            expect(Node.findById(node.id)).to.eventually.exist;
            done();
          });
        });
      });
    });

    context('with a master node', () => {
      beforeEach(() => {
        node.master = true;
        return node.save().then(() => {
          node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
          return node.destroy();
        });
      });

      it('reports back the master deletion to its cluster', () => {
        expect(cluster.notify)
          .to.have.been.calledWith({ last_state: 'destroyed', master: true });
      });
    });

    context('with a byon node', () => {
      beforeEach(() => {
        _.merge(node, { byon: true, region: null, node_size: null });

        sinon.stub(machine, 'destroy', machine.destroy);

        return node.save().then(() => {
          node.getCluster = sinon.stub().returns(Promise.resolve(cluster));
          return node.destroy();
        });
      });

      afterEach(() => {
        machine.destroy.restore();
      });

      it('reports back the deletion to its cluster', () => {
        expect(cluster.notify)
          .to.have.been.calledWith({ last_state: 'destroyed', master: false });
      });

      it("doesn't attempt to remove the machine behind", () => {
        expect(machine.destroy).to.not.have.been.called;
      });
    });
  });

  describe('#change', () => {
    let node, attributes = { name: random.string() };

    context('when node is not in running state', () => {
      beforeEach(() => {
        node = factory.buildSync('node');
        sinon.stub(machine, 'update', machine.update);
        return node.save();
      });

      afterEach(() => {
        machine.update.restore();
      });

      it("doesn't update the node", done => {
        let notExpected = _.merge({ last_state: 'updating' }, attributes);

        node.change(attributes).then(done).catch(() => {
          expect(node.reload())
            .to.eventually.not.include(notExpected)
            .notify(done);
        });
      });

      it("doesn't update the machine behind", done => {
        node.change(attributes).then(done).catch(() => {
          expect(machine.update).to.not.have.been.called;
          done();
        });
      });

      it('returns an error', done => {
        node.change(attributes).then(done).catch(err => {
          expect(err)
            .to.deep.equal(new errors.StateError('update', node.state));
          done();
        });
      });
    });

    context('when node is in running state', () => {
      beforeEach(() => {
        node = factory.buildSync('runningNode');
        return node.save();
      });

      context('when there is no changes', () => {
        beforeEach(() => {
          sinon.stub(machine, 'update', machine.update);
        });

        afterEach(() => {
          machine.update.restore();
        });

        it("doesn't update the node", () => {
          let expected = node.dataValues;

          return expect(node.change({}))
            .to.eventually.have.property('dataValues', expected);
        });

        it("doesn't update the machine behind", () => {
          return node.change({}).then(() => {
            return expect(machine.update).to.not.have.been.called;
          });
        });
      });

      context('when validation failed', () => {
        let badAttributes = { master: 'lol' };

        beforeEach(() => {
          node = factory.buildSync('node');
          sinon.stub(machine, 'update', machine.update);
          return node.save();
        });

        afterEach(() => {
          machine.update.restore();
        });

        it("doesn't update the node", done => {
          let notExpected = _.merge({ last_state: 'updating' }, badAttributes);

          node.change(badAttributes).then(done).catch(() => {
            expect(node.reload())
              .to.eventually.not.include(notExpected)
              .notify(done);
          });
        });

        it("doesn't update the machine behind", done => {
          node.change(badAttributes).then(done).catch(() => {
            expect(machine.update).to.not.have.been.called;
            done();
          });
        });
      });

      context('when machine update succeeds', () => {
        beforeEach(() => {
          sinon.stub(machine, 'update').returns(Promise.resolve());
          return node.change(attributes);
        });

        afterEach(() => {
          machine.update.restore();
        });

        it('updates the attributes', () => {
          expect(node).to.include(attributes);
        });

        it('set the node state to updating', () => {
          expect(node.state).to.equal('updating');
        });

        it('updates the machine behind', () => {
          expect(machine.update).to.have.been.calledWith(attributes);
        });
      });

      context('when machine update failed', () => {
        beforeEach(() => {
          sinon.stub(machine, 'update').returns(Promise.reject());
        });

        afterEach(() => {
          machine.update.restore();
        });

        it("doesn't update the node", done => {
          let notExpected = _.merge({ last_state: 'updating' }, attributes);

          node.change(attributes).then(done).catch(err => {
            expect(node.reload())
              .to.eventually.not.include(notExpected)
              .notify(done);
          });
        });
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
      let node;

      beforeEach(() => {
        node = factory.buildSync('runningNode');

        return node.save().then(() => {
          return node.upgrade(config.latestVersions);
        });
      });

      it('it is in upgrading state', () => {
        expect(node.state).to.equal('upgrading');
      });

      it('upgrades the machine behind', () => {
        expect(machine.upgrade).to.have.been.calledWith(config.latestVersions);
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
  });

  describe('#agentInfos', () => {
    let cluster, node;

    beforeEach(() => {
      cluster = factory.buildSync('cluster')
      return cluster.save().then(cluster => {
        node = factory.buildSync('node', { cluster_id: cluster.id });
        return node.save();
      });
    });

    it('returns informations needed by the agent', () => {
      return expect(node.agentInfos())
        .to.eventually.deep.equal({
          master: node.master,
          name: node.name,
          cert: {
            ca:   cluster.cert.server_ca,
            cert: cluster.cert.server_cert,
            key:  cluster.cert.server_key,
          },
          strategy: cluster.strategy,
          versions: {
            docker: cluster.docker_version,
            swarm:  cluster.swarm_version
          }
        });
    });
  });
});
