'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  models = require('../../app/models'),
  support = require('../../app/support'),
  concerns = require('./concerns'),
  config = require('../../config');

const DEFAULT_STRATEGY = 'spread',
      VALID_STRATEGIES = [DEFAULT_STRATEGY, 'binpack', 'random'];

describe('Cluster Model', () => {
  db.sync();

  concerns('cluster').behavesAsAStateMachine();

  concerns('cluster').hasSubdomainable('name');

  concerns('cluster').serializable({
    omit:  ['user_id', 'cert', 'last_state'],
    links: ['nodes']
  });

  describe('validations', () => {
    it('succeeds with valid attributes', done => {
      factory.create('cluster', done);
    });

    it('succeeds to create multiple clusters', done => {
      factory.createMany('cluster', 3, done);
    });

    VALID_STRATEGIES.forEach(strategy => {
      it(`succeeds with a ${strategy} strategy`, () => {
        let cluster = factory.buildSync('cluster', { strategy: strategy });

        return expect(cluster.save()).to.be.fulfilled;
      });
    });

    it('succeeds with the same name for different users', () => {
      let user1 = factory.buildSync('user'),
        user2 = factory.buildSync('user');

      return expect(user1.save().then(() => {
        return factory.buildSync('cluster', { user_id: user1.id }).save();
      }).then(() => {
        return user2.save();
      }).then(() => {
        return factory.buildSync('cluster', { user_id: user2.id }).save();
      })).to.be.fulfilled;
    });

    context('when it belongs to the same user', () => {
      let user;

      beforeEach(() => {
        user = factory.buildSync('user');
        return user.save();
      });

      it('fails with multiple node with the same name', () => {
        let opts = { name: 'test', user_id: user.id };

        return expect(factory.buildSync('cluster', opts).save()
        .then(() => {
          return factory.buildSync('cluster', opts).validate();
        })).to.eventually.exist;
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

  context('adding a node to this cluster', () => {
    let cluster, previousNodesCount;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
      return cluster.save().then(() => {
        previousNodesCount = cluster.nodes_count;
        return factory.buildSync('node', { cluster_id: cluster.id }).save();
      }).then(() => {
        return cluster.reload();
      });
    });

    it('increases its node counter cache', () => {
      expect(cluster.nodes_count).to.equal(previousNodesCount + 1);
    });
  });

  describe('#create', () => {
    const FAKE_CERTS = {
      client: {
        cert: random.string(), key: random.string(), ca: random.string()
      },
      server: {
        cert: random.string(), key: random.string(), ca: random.string()
      }
    };

    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
    });

    context('when cert creation succeeded', () => {
      beforeEach(() => {
        sinon.stub(support.cert, 'generate').returns(
          Promise.resolve(FAKE_CERTS)
        );
        return cluster.save();
      });

      afterEach(() => {
        support.cert.generate.restore();
      });

      it('initializes its ssl certificates', () => {
        expect(cluster.cert).to.deep.equal(FAKE_CERTS);
      });

      ['docker', 'swarm'].forEach(binary => {
        it(`initializes ${binary} with the latest version available`, () => {
          expect(cluster[`${binary}_version`])
            .to.equal(config.latestVersions[binary]);
        });
      });
    });

    context('when cert creation failed', () => {
      const ERROR = random.error();

      beforeEach(() => {
        sinon.stub(support.cert, 'generate').returns(Promise.reject(ERROR));
      });

      afterEach(() => {
        support.cert.generate.restore();
      });

      it('returns the error', () => {
        return expect(cluster.save()).to.be.rejectedWith(ERROR);
      });

      it("doesn't create the cluster", done => {
        cluster.save().then(done).catch(err => {
          expect(models.Cluster.findById(cluster.id))
            .to.eventually.not.exist
            .notify(done);
        });
      });
    });
  });

  describe('#notify', () => {
    const BUSY_STATES = ['deploying', 'upgrading', 'updating'];

    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('runningCluster');
      return cluster.save();
    });

    BUSY_STATES.forEach(state => {
      context(`with a last state equal to ${state}`, () => {
        let lastSeen;

        beforeEach(() => {
          lastSeen = cluster.last_seen;
          return cluster.notify({ last_state: state });
        });

        it(`has a state set to ${state}`, () => {
          expect(cluster.state).to.equal(state);
        });

        it('has the same last seen than before', () => {
          expect(cluster.last_seen).to.deep.equal(lastSeen);
        });
      });
    });

    context('with a last state equal to running', () => {
      BUSY_STATES.forEach(state => {
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
      BUSY_STATES.forEach(state => {
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
          });
        });

        context('when master is destroyed', () => {
          beforeEach(() => {
            return cluster.notify(
              { last_state: 'destroyed', last_seen: null }
            );
          });

          it(`is in unreachable state`, () => {
            expect(cluster.state).to.equal('unreachable');
          });
        });

        context('when a slave is destroyed', () => {
          beforeEach(() => {
            return cluster.notify({ last_state: 'destroyed' });
          });

          it(`is in running state`, () => {
            expect(cluster.state).to.equal('running');
          });
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

    context('with last seen', () => {
      let lastSeen, lastState;

      beforeEach(() => {
        lastSeen = moment();
        lastState = cluster.state;
        return cluster.notify({ last_seen: lastSeen });
      });

      it('updates the cluster last seen with the provided value', () => {
        expect(cluster.last_seen).to.deep.equal(lastSeen.toDate());
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
