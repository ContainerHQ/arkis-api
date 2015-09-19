'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  models = require('../../app/models'),
  support = require('../../app/support'),
  concerns = require('./concerns'),
  config = require('../../config');

describe('Cluster Model', () => {
  db.sync();

  concerns('cluster').behavesAsAStateMachine({
    attribute: {
      name: 'last_state',
      default: 'empty',
      values: ['empty', 'deploying', 'upgrading', 'updating', 'running']
    },
    expiration: {
      when: 'running',
      mustBe: 'unreachable',
      constraint: {
        name: 'last_seen'
      },
      after: config.agent.heartbeat
    }
  });

  concerns('cluster').serializable({
    omit:  ['user_id', 'cert', 'last_state'],
    links: ['nodes']
  });

  concerns('cluster').has({
    default: {
      strategy: 'spread',
      docker_version: config.latestVersions.docker || '.',
      swarm_version:  config.latestVersions.swarm  || '.'
    },
    counterCache: ['node']
  });

  concerns('cluster').validates({
    strategy: {
      presence: true,
      inclusion: ['spread', 'binpack', 'random']
    },
    name: {
      uniqueness: { scope: 'user', type: 'string' },
      subdomainable: true
    },
    docker_version: {
      presence: true
    },
    swarm_version: {
      presence: true
    }
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

    ['running', 'destroyed'].forEach(lastState => {
      context(`with a last state equal to ${lastState}`, () => {
        BUSY_STATES.forEach(state => {
          context(
            `when cluster has at least one node in state ${state}`
          , () => {
            beforeEach(() => {
              return cluster.addNode(factory.buildSync('node', {
                last_state: state
              }))
              .then(() => {
                return cluster.addNode(factory.buildSync('runningNode'))
              }).then(() => {
                return cluster.reload();
              }).then(() => {
                return cluster.notify({ last_state: lastState })
              });
            });

            it(`is in ${state} state`, () => {
              expect(cluster.state).to.equal(state);
            });
          });
        });

        if (lastState === 'running') {
          context('when cluster has only nodes in running state', () => {
            beforeEach(() => {
              return cluster.addNode(factory.buildSync('runningNode'))
              .then(() => {
                return cluster.update({ last_state: 'upgrading' })
              }).then(() => {
                return cluster.reload();
              }).then(() => {
                return cluster.notify({ last_state: lastState })
              });
            });

            it(`is in running state`, () => {
              expect(cluster.state).to.equal('running');
            });
          });
        }

        if (lastState === 'destroyed') {
          context('when cluster has only nodes in running state', () => {
            beforeEach(() => {
              return cluster.addNode(factory.buildSync('runningNode'))
              .then(() => {
                return cluster.reload();
              }).then(() => {
                return cluster.update({ last_state: 'upgrading' })
              });
            });

            context('when master is destroyed', () => {
              beforeEach(() => {
                return cluster.notify(
                  { last_state: lastState, last_seen: null }
                );
              });

              it(`is in unreachable state`, () => {
                expect(cluster.state).to.equal('unreachable');
              });
            });

            context('when a slave is destroyed', () => {
              beforeEach(() => {
                return cluster.notify({ last_state: lastState });
              });

              it(`is in running state`, () => {
                expect(cluster.state).to.equal('running');
              });
            });
          });

          context('when cluster has no longer any node', () => {
            beforeEach(() => {
              return cluster.update({ last_state: 'upgrading' }).then(() => {
                return cluster.notify({ last_state: lastState });
              });
            });

            it(`is in empty state`, () => {
              expect(cluster.state).to.equal('empty');
            });
          });
        }
      });
    });

    context('with last seen', () => {
      let lastSeen, lastState;

      beforeEach(() => {
        lastSeen  = moment();
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
  });
});
