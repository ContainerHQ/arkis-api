'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/routes/shared/errors'),
  machine = require('../support/machine'),
  models = require('../../app/models'),
  concerns = require('./concerns');

const DEFAULT_STRATEGY = 'spread',
      VALID_STRATEGIES = [DEFAULT_STRATEGY, 'binpack', 'random'];

describe('Cluster Model', () => {
  db.sync();

  concerns.behavesAsAStateMachine('cluster');

  describe('validations', () => {
    it('succeeds with valid attributes', done => {
      factory.create('cluster', done);
    });

    it('succeeds to create multiple clusters', done => {
      factory.createMany('cluster', 3, done);
    });

    it('succeeds with a min size name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 1) });

      return expect(cluster.save()).to.be.fulfilled;
    });

    it('succeeds with a max size name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 64) });

      return expect(cluster.save()).to.be.fulfilled;
    });

    VALID_STRATEGIES.forEach(strategy => {
      it(`succeeds with a ${strategy} strategy`, () => {
        let cluster = factory.buildSync('cluster', { strategy: strategy });

        return expect(cluster.save()).to.be.fulfilled;
      });
    });

    it('fails without a name', () => {
      let cluster = factory.buildSync('cluster', { name: null });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with an empty name', () => {
      let cluster = factory.buildSync('cluster', { name: '' });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with a too long name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 65) });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with multiple node with the same name', done => {
      factory.createMany('cluster', { name: 'test' }, 2, err => {
        expect(err).to.exist;
        done();
      });
    });

    it('fails with an empty strategy', () => {
      let cluster = factory.buildSync('cluster', { strategy: null });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with an invalid strategy', () => {
      let cluster = factory.buildSync('cluster', { strategy: 'whatever' });

      return expect(cluster.save()).to.be.rejected;
    });
  });

  it('has a default strategy', () => {
    let cluster = factory.buildSync('cluster');

    return expect(cluster.save())
      .to.eventually.have.property('strategy', DEFAULT_STRATEGY);
  });

  context('#upgrade', () => {
    context('when cluster is not running', () => {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('cluster');
        return cluster.save();
      });

      it('returns an error', () => {
        let expected = new errors.StateError('upgrade', cluster.state);

        return cluster.upgrade().catch(err => {
          return expect(err).to.deep.equal(expected);
        });
      });
    });

    context('when cluster is running', () => {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('runningCluster');
        return cluster.save();
      });

      context.skip('when cluster already has the latest versions', () => {

      });

      context('when nodes upgrade succeeds', () => {
        let fakeNodes;

        beforeEach(() => {
          fakeNodes = _.map(new Array(10), () => {
            return { upgrade: sinon.stub().returns(true) };
          });
          cluster.getNodes = sinon.stub().returns(Promise.resolve(fakeNodes));
        });

        ['docker', 'swarm'].forEach(binary => {
          it.skip(`has the latest ${binary} version available`, () => {

          });
        });

        it('is in upgrading state', () => {
          return expect(cluster.upgrade().then(() => {
            return cluster.reload();
          })).to.eventually.have.property('state', 'upgrading');
        });

        it('upgrades all the cluster nodes', () => {
          return cluster.upgrade().then(() => {
            fakeNodes.forEach(node => {
              expect(node.upgrade).to.have.been.called;
            });
          });
        });

        it('returns the upgraded cluster', () =>{
          return expect(cluster.upgrade())
            .to.eventually.deep.equal(cluster);
        });
      });

      // Add a tests verifying that we receive a promise chain
      // equal to all nodes.upgrade + cluster.update

      context('when a node upgrade fails', () => {
        let fakeNodes;

        beforeEach(() => {
          fakeNodes = _.map(new Array(10), () => {
            return { upgrade: sinon.stub().returns(false) };
          });
          cluster.getNodes = sinon.stub().returns(Promise.resolve(fakeNodes));
        });

        it('cancels all nodes upgrade', () => {
          return cluster.upgrade().catch(() => {
            fakeNodes.forEach(node => {
              expect(node.upgrade).not.to.have.been.called;
            });
          });
        });

        it('is not in upgrading state', () => {
          return cluster.upgrade().catch(() => {
            return expect(cluster.reload())
              .not.to.eventually.have.property('state', 'upgrading')
          });
        });

        ['docker', 'swarm'].forEach(binary => {
          it.skip(`has the same ${binary} version as before`, () => {
          });
        });
      });
    });
  });

  context.skip('#notify', () => {

  });

  context('afterDestroy', () => {
    let cluster, nodesId;

    beforeEach(done => {
      sinon.stub(machine, 'deleteToken', machine.deleteToken);

      factory.create('cluster', (err, clusterCreated) => {
        if (err) { return done(err); };

        cluster = clusterCreated;
        factory.createMany('node', { cluster_id: cluster.id }, 10,
          (err, nodes) => {
            nodesId = _.pluck(nodes, 'id');
            done(err);
        });
      });
    });

    afterEach(() => {
      machine.deleteToken.restore();
    });

    it('deletes its token', done => {
      let token = cluster.token;

      cluster.destroy().then(() => {
        expect(machine.deleteToken).to.have.been.calledWith(token);
        done();
      }).catch(done);
    });

    it('removes its nodes', () => {
      return expect(
        cluster.destroy().then(() => {
          return models.Node.findAll({ where: { id: nodesId } });
        })
      ).to.be.fulfilled.and.to.eventually.be.empty;
    });
  });

  context('afterCreate', () => {
    const FAKE_TOKEN = machine.createFakeToken(),
          FAKE_CERTS = machine.createFakeCerts();

    let cluster;

    beforeEach(() => {
      sinon.stub(machine, 'createToken').returns(new Promise(resolve => {
        resolve(FAKE_TOKEN);
      }));
      sinon.stub(machine, 'createCerts').returns(new Promise(resolve => {
        resolve(FAKE_CERTS);
      }));
      cluster = factory.buildSync('cluster');
      return cluster.save();
    });

    afterEach(() => {
      machine.createToken.restore();
      machine.createCerts.restore();
    });

    it('creates its token', () => {
      expect(cluster.token).to.equal(FAKE_TOKEN);
    });

    it('creates its ssl certificates', () => {
      return expect(cluster.getCert())
        .to.eventually.satisfy(has.certificate(FAKE_CERTS));
    });

    it('can be deleted', () => {
      return expect(cluster.destroy()).to.be.fulfilled;
    });

    context('adding a node to this cluster', () => {
      let previousNodesCount;

      beforeEach(() => {
        previousNodesCount = cluster.nodes_count;

        return factory.buildSync('node', { cluster_id: cluster.id })
        .save().then(() => {
          return cluster.reload();
        });
      });

      it('increases its node counter cache', () => {
        expect(cluster.nodes_count).to.equal(previousNodesCount + 1);
      });
    });
  });

  context('afterDestroy', () => {
    let cluster, nodesId;

    beforeEach(done => {
      sinon.stub(machine, 'deleteToken', machine.deleteToken);

      factory.create('cluster', (err, clusterCreated) => {
        if (err) { return done(err); };

        cluster = clusterCreated;

        factory.createMany('node', { cluster_id: cluster.id }, 10,
          (err, nodes) => {
            nodesId = _.pluck(nodes, 'id');
            done(err);
        });
      });
    });

    afterEach(() => {
      machine.deleteToken.restore();
    });

    it('deletes its token', done => {
      let token = cluster.token;

      cluster.destroy().then(() => {
        expect(machine.deleteToken).to.have.been.calledWith(token);
        done();
      }).catch(done);
    });

    it('deletes its ssl certificates', () => {
      let certId;

      return expect(
        cluster.getCert().then(cert => {
          certId = cert.id;
          return cluster.destroy();
        }).then(() =>{
          return models.Cert.findById(certId);
        })
      ).to.be.fulfilled.and.to.eventually.not.exist;
    });

    it('removes its nodes', () => {
      return expect(
        cluster.destroy().then(() => {
          return models.Node.findAll({ where: { id: nodesId } });
        })
      ).to.be.fulfilled.and.to.eventually.be.empty;
    });
  });
});
