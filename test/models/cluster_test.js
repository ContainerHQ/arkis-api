'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  models = require('../../app/models'),
  connectors = require('../../app/connectors'),
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
    omit:  ['user_id', 'cert', 'encrypted_cert', 'last_state'],
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
    const FAKE_CERT = {
      client: {
        cert: random.string(), key: random.string(), ca: random.string()
      },
      server: {
        cert: random.string(), key: random.string(), ca: random.string()
      }
    };

    let cluster, revert;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
      revert  = connectors.Cert.generate;
    });

    afterEach(() => {
      connectors.Cert.generate = revert;
    });

    context('when cert creation succeeded', () => {
      beforeEach(() => {
        connectors.Cert.generate = () => {
          return Promise.resolve(FAKE_CERT);
        };
        return cluster.save();
      });

      it('initializes its ssl certificates', () => {
        expect(cluster.cert).to.deep.equal(FAKE_CERT);
      });

      it('stores its ssl certificates as a encrypted text', () => {
        expect(cluster).to.satisfy(
          has.encrypted('cert', { algorithm: 'aes' })
        );
      });
    });

    context('when cert creation failed', () => {
      const ERROR = random.error();

      beforeEach(() => {
        connectors.Cert.generate = () => {
          return Promise.reject(ERROR);
        };
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

  describe('#adaptStateTo', () => {
    let cluster, node;

    beforeEach(() => {
      cluster = factory.buildSync('runningCluster');
      return cluster.save().then(() => {
        node = factory.buildSync('runningNode', { cluster_id: cluster.id });
        return node.save();
      }).then(() => {
        return cluster.reload();
      });
    });

    ['destroyed', 'notify'].forEach(action => {
      context('with action destroyed', () => {
        if (action === 'destroyed') {
          context('when node sent is the last one', () => {
            beforeEach(() => {
              return cluster.adaptStateTo({ action: action, node: node });
            });

            it('is in empty state', () => {
              return expect(cluster.reload())
                .to.eventually.have.property('state', 'empty');
            });

            it('has a last_seen equal to null', () => {
              return expect(cluster.reload())
                .to.eventually.have.property('last_seen', null);
            });
          });
        }

        context('when cluster has multiple nodes', () => {
          beforeEach(done => {
            let opts = { cluster_id: cluster.id };

            factory.createMany('runningNode', opts, 5, err => {
              cluster.reload().then(() => { done(err); }).catch(done);
            });
          });

          if (action === 'destroyed') {
            context('when node sent is master', () => {
              beforeEach(() => {
                return node.update({ master: true }).then(() => {
                  return cluster.adaptStateTo({ action: action, node: node });
                });
              });

              it('resets its last_seen', () => {
                return expect(cluster.reload())
                  .to.eventually.have.property('last_seen', null);
              });
            });
          }

          context('when other nodes are in running state', () => {
            beforeEach(() => {
              return cluster.adaptStateTo({ action: action, node: node });
            });

            it('is in running state', () => {
              return expect(cluster.reload())
                .to.eventually.have.property('state', 'running');
            });

            it('keeps its last seen', () => {
              return expect(cluster.reload())
                .to.eventually.have.property('last_seen').to.not.be.null;
            });

            context('when one other node is not in running state', () => {
              let otherNode;

              beforeEach(() => {
                return cluster.createNode(factory.buildSync('node').dataValues)
                .then(node => {
                  otherNode = node;
                  return cluster.reload();
                }).then(() => {
                  return cluster.adaptStateTo({ action: action, node: node });
                });
              });

              it('takes the other node last state', () => {
                return expect(cluster.reload())
                  .to.eventually.have.property('last_state', otherNode.last_state);
              });

              it('keeps its last seen', () => {
                return expect(cluster.reload())
                  .to.eventually.have.property('last_seen').to.not.be.null;
              });
            });
          });
        });
      });
    });

    context('with any action', () => {
      context('with masterSwitch', () => {
        context('when node sent is master', () => {
          beforeEach(() => {
            return node.update({ master: true }).then(() => {
              return cluster.adaptStateTo(
                { action: 'update', node: node, masterSwitch: true }
              );
            });

            it('takes the node last_seen', () => {
              return expect(cluster.reload())
                .to.eventually.have.property('last_seen', node.last_seen);
            });
          });
        });

        context('when node sent is not master', () => {
          beforeEach(() => {
            return cluster.adaptStateTo(
              { action: 'update', node: node, masterSwitch: true }
            );
          });

          it('resets its last_seen', () => {
            return expect(cluster.reload())
              .to.eventually.have.property('last_seen', null);
          });
        });
      });
    });

    context('with other action', () => {
      beforeEach(() => {
        return cluster.adaptStateTo({ action: random.string(), node: node });
      });

      it('takes the node last_state', () => {
        return expect(cluster.reload())
          .to.eventually.have.property('last_state', node.last_state);
      });
    });
  });
});
