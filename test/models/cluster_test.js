'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/routes/shared/errors'),
  machine = require('../support/machine'),
  models = require('../../app/models'),
  concerns = require('./concerns'),
  versions = require('../../config/versions');

const DEFAULT_STRATEGY = 'spread',
      VALID_STRATEGIES = [DEFAULT_STRATEGY, 'binpack', 'random'],
      LATEST_VERSIONS  = _.first(versions);

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

    it('succeeds with the same name for different users', () => {
      let user1 = factory.buildSync('user'),
        user2 = factory.buildSync('user', { email: 'user2@arkis.io' } );

      return expect(user1.save().then(() => {
        return factory.buildSync('cluster', { user_id: user1.id }).save();
      }).then(() => {
        return user2.save();
      }).then(() => {
        return factory.buildSync('cluster', { user_id: user2.id }).save();
      })).to.be.fulfilled;
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

    context('when it belongs to the same user', () => {
      let user;

      beforeEach(() => {
        user = factory.buildSync('user');
        return user.save();
      });

      it('fails with multiple node with the same name', done => {
        let opts = { name: 'test', user_id: user.id };

        factory.createMany('cluster', opts, 2, err => {
          expect(err).to.exist;
          done();
        });
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

  describe('#create', () => {
    const FAKE_TOKEN = machine.createFakeToken(),
          FAKE_CERTS = machine.createFakeCerts();

    let cluster;

    beforeEach(() => {
      sinon.stub(machine, 'createToken').returns(Promise.resolve(FAKE_TOKEN));
      sinon.stub(machine, 'createCerts').returns(Promise.resolve(FAKE_CERTS));
      cluster = factory.buildSync('cluster');
      return cluster.save();
    });

    afterEach(() => {
      machine.createToken.restore();
      machine.createCerts.restore();
    });

    it('initializes its token', () => {
      expect(cluster.token).to.equal(FAKE_TOKEN);
    });

    it('initializes its ssl certificates', () => {
      return expect(cluster.getCert())
        .to.eventually.satisfy(has.certificate(FAKE_CERTS));
    });

    ['docker', 'swarm'].forEach(binary => {
      it(`initializes ${binary} with the latest version available`, () => {
        expect(cluster[`${binary}_version`]).to.equal(LATEST_VERSIONS[binary]);
      });
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

  describe('#upgrade', () => {
    context('when cluster is not running', () => {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('cluster');
        return cluster.save();
      });

      it('returns an error', () => {
        let expected = new errors.StateError('upgrade', cluster.state);

        return cluster.upgrade().then(() => {
          throw new Error('Upgrade should be rejected!');
        }).catch(err => {
          return expect(err).to.deep.equal(expected);
        });
      });
    });

    context('when cluster is running', () => {
      let cluster;


      beforeEach(() => {
        cluster = factory.buildSync('runningCluster');
        return updateClusterToOldestVersions(cluster);
      });

      ['docker', 'swarm'].forEach(binary => {
        context(`when cluster already has the latest ${binary} version`, () => {
          beforeEach(() => {
            return cluster.update({
              docker_version: LATEST_VERSIONS.docker,
              swarm_version:  LATEST_VERSIONS.swarm
            });
          });

          it('returns an upgrade version error', () => {
            return cluster.upgrade().then(() => {
              throw new Error('Upgrade should be rejected!');
            }).catch(err => {
              return expect(err)
                .to.deep.equal(new errors.AlreadyUpgradedError());
            });
          });

          it(`has the same ${binary} version as before`, () => {
            return cluster.upgrade().then(() => {
              throw new Error('Upgrade should be rejected!');
            }).catch(() => {
              expect(cluster[`${binary}_version`])
                .to.equal(LATEST_VERSIONS[binary]);
            });
          });
        });
      });
    });

    ['resolve', 'reject'].forEach(result => {
      contextNodeUpgrade(result);
    });

    function contextNodeUpgrade(result) {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('runningCluster');
        return updateClusterToOldestVersions(cluster);
      });

      context(`when a node upgrade has been ${result}ed`, () => {
        let fakeNodes, upgradedCluster;

        beforeEach(() => {
          fakeNodes = _.map(new Array(10), () => {
            return { upgrade: sinon.stub().returns(Promise[result]()) };
          });
          cluster.getNodes = sinon.stub().returns(Promise.resolve(fakeNodes));
          return cluster.upgrade().then(cluster => {
            upgradedCluster = cluster;
          });
        });

        ['docker', 'swarm'].forEach(binary => {
          it(`has the latest ${binary} version available`, () => {
            let latestVersion = LATEST_VERSIONS[binary];

            expect(cluster[`${binary}_version`], latestVersion);
          });
        });

        it('is in upgrading state', () => {
          expect(cluster.state).to.equal('upgrading');
        });

        it('upgrades all the cluster nodes', () => {
          fakeNodes.forEach(node => {
            expect(node.upgrade).to.have.been.called;
          });
        });

        it('returns the upgraded cluster', () =>{
          expect(upgradedCluster).to.deep.equal(cluster);
        });
      });
    }
  });

  /*
   * A cluster is currently created with the latest versions avaiable.
   * We need to update it with a prior versions in order to validate
   * the following test suite.
   */
  function updateClusterToOldestVersions(cluster) {
    return cluster.save().then(() => {
      return cluster.update({
        docker_version: '0.0.0',
        swarm_version:  '0.0.0'
      });
    });
  }

  describe('#destroy', () => {
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
      return expect(cluster.destroy().then(() => {
        return models.Node.findAll({ where: { id: nodesId } });
      })).to.be.fulfilled.and.to.eventually.be.empty;
    });
  });

  describe('#notify', () => {
    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('runningCluster');
      return cluster.save();
    });

    ['deploying', 'upgrading'].forEach(state => {
      context(`with a last state equal to ${state}`, () => {
        let lastPing;

        beforeEach(() => {
          lastPing = cluster.last_ping;
          return cluster.notify({ last_state: state });
        });

        it(`has a state set to ${state}`, () => {
          expect(cluster.state).to.equal(state);
        });

        it('has the same last ping than before', () => {
          expect(cluster.last_ping).to.deep.equal(lastPing);
        });
      });
    });

    context('with a last state equal to running', () => {
      ['deploying', 'upgrading'].forEach(state => {
        context(`when cluster has at least one node in state ${state}`, () => {
          beforeEach(() => {
            return addNodeTo(cluster, 'node', { last_state: state })
            .then(() => {
              return addNodeTo(cluster, 'runningNode');
            }).then(() => {
              return cluster.notify({ last_state: 'running' })
            });
          });

          it(`is in ${state} state`, () => {
            expect(cluster.state).to.equal(state);
          });
        });
      });

      context('when cluster has only nodes in running state', () => {
        beforeEach(() => {
          return addNodeTo(cluster, 'runningNode').then(() => {
            return cluster.update({ last_state: 'upgrading' })
          }).then(() => {
            return cluster.notify({ last_state: 'running' })
          });
        });

        it(`is in running state`, () => {
          expect(cluster.state).to.equal('running');
        });
      });
    });

    context('with destroyed', () => {
      ['deploying', 'upgrading'].forEach(state => {
        context(`when cluster has at least one node in state ${state}`, () => {
          beforeEach(() => {
            return addNodeTo(cluster, 'node', { last_state: state })
            .then(() => {
              return addNodeTo(cluster, 'runningNode');
            }).then(() => {
              return cluster.notify({ last_state: 'destroyed' })
            });
          });

          it(`is in ${state} state`, () => {
            expect(cluster.state).to.equal(state);
          });
        });
      });

      context('when cluster has only nodes in running state', () => {
        beforeEach(() => {
          return addNodeTo(cluster, 'runningNode').then(() => {
            return cluster.update({ last_state: 'upgrading' })
          }).then(() => {
            return cluster.notify({ last_state: 'destroyed' })
          });
        });

        it(`is in running state`, () => {
          expect(cluster.state).to.equal('running');
        });
      });

      context('when cluster has no longer any node', () => {
        beforeEach(() => {
          return cluster.update({ last_state: 'upgrading' }).then(() => {
            return cluster.notify({ last_state: 'destroyed' });
          });
        });

        it(`is in empty state`, () => {
          expect(cluster.state).to.equal('empty');
        });
      });
    });

    context('with last ping', () => {
      let lastPing, lastState;

      beforeEach(() => {
        lastPing = moment();
        lastState = cluster.state;
        return cluster.notify({ last_ping: lastPing });
      });

      it('updates the cluster last ping with the provided value', () => {
        expect(cluster.last_ping).to.deep.equal(lastPing.toDate());
      });

      it('has the same state than before', () => {
        expect(cluster.state).to.equal(lastState);
      });
    });

    function addNodeTo(cluster, factoryName, opts={}) {
      _.merge(opts, { cluster_id: cluster.id });

      let node = factory.buildSync(factoryName, opts);

      return cluster.addNode(node).then(() => {
        return cluster.reload();
      });
    }
  });
});
