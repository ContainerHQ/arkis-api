'use strict';

var _ = require('lodash'),
  config = require('../../config'),
  errors = require('../../app/support').errors,
  DaemonManager = require('../../app/services').DaemonManager,
  ClusterManager = require('../../app/services').ClusterManager;

const VERSIONS = ['docker_version', 'swarm_version'];

describe('ClusterManager Service', () => {
  let manager;

  beforeEach(() => {
    return factory.buildSync('runningCluster').save().then(cluster => {
      manager = new ClusterManager(cluster);
    });
  });

  describe('#getNodeDaemons', () => {
    context('when cluster has nodes', () => {
      beforeEach(done => {
        factory.createMany('node', { cluster_id: manager.cluster.id }, 7, done);
      });

      it('returns all cluster nodes daemons manager', () => {
        let expected;

        return manager.cluster.getNodes().then(nodes => {
          expected = _.map(nodes, node => {
            return new DaemonManager(manager.cluster, node);
          });
          return manager.getNodeDaemons();
        }).then(daemons => {
          return expect(daemons).to.deep.equal(expected);
        });
      });
    });

    context('when cluster is empty', () => {
      it('returns an empty list', () => {
        return manager.getNodeDaemons().then(daemons => {
          return expect(daemons).to.be.empty;
        });
      });
    });
  });

  describe('#upgrade', () => {
    beforeEach(done => {
      let opts = { cluster_id: manager.cluster.id };

      factory.createMany('runningNode', opts, 5, done);
    });

    context('when cluster is not running', () => {
      let actualErr, previousVersions;

      beforeEach(done => {
        manager.cluster.update({ last_state: 'updating' }).then(() => {
          previousVersions = _.pick(manager.cluster, VERSIONS);
          return manager.upgrade();
        }).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns a state error', () => {
        let expected = new errors.StateError('upgrade', manager.cluster.state);

        expect(actualErr).to.deep.equal(expected);
      });

      it('has the same versions than before', () => {
        expect(manager.cluster).to.include(previousVersions);
      });

      it("doenst' upgrade its nodes", () => {
        return manager.cluster.getNodes().then(nodes => {
          return expect(_.all(nodes, node => {
            return node.state !== 'upgrading';
          }));
        });
      });
    });

    context('when cluster already has the latest versions', () => {
      let actualErr, previousVersions;

      beforeEach(done => {
        previousVersions = _.pick(manager.cluster, VERSIONS);
        manager.upgrade().then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns an already updraded error', () => {
        expect(actualErr).to.deep.equal(new errors.AlreadyUpgradedError());
      });

      it('has the same versions than before', () => {
        expect(manager.cluster).to.include(previousVersions);
      });

      it("doesnt' upgrade its nodes", () => {
        return manager.cluster.getNodes().then(nodes => {
          return expect(_.all(nodes, node => {
            return node.state === 'upgrading';
          })).to.be.false;
        });
      });
    });

    context('when cluster has older versions', () => {
      const OLDEST_VERSIONS = {
        docker_version: config.oldestVersions.docker,
        swarm_version:  config.oldestVersions.swarm
      };

      beforeEach(() => {
        return manager.cluster.update(OLDEST_VERSIONS);
      });

      context('when its nodes are upgradable', () => {
        let result;

        beforeEach(() => {
          return manager.upgrade().then(res => {
            result = res;
          });
        });

        it('updates its versions to the latest versions available', () => {
          return expect(manager.cluster.reload()).to.eventually.include({
            docker_version: config.latestVersions.docker,
            swarm_version:  config.latestVersions.swarm
          });
        });

        it('returns no error', () => {
          expect(result.errors).to.be.empty;
        });

        it('upgrades its nodes', () => {
          return manager.cluster.getNodes().then(nodes => {
            return expect(_.all(nodes, node => {
              return node.state === 'upgrading';
            })).to.be.true;
          });
        });

        it('returns an upgrade action for each of its node', () => {
          return manager.cluster.getNodes().then(nodes => {
            return expect(_.map(nodes, node => {
              return _.findWhere(result.actions, {
                type: 'upgrade',
                completed_at: null,
                last_state: 'in-progress',
                resource: 'node',
                resource_id: node.id
              });
            })).to.not.include(undefined);
          });
        });
      });

      context('when some node upgrades has issues', () => {
        let result;

        beforeEach(done => {
          let opts = { cluster_id: manager.cluster.id };

          factory.createMany('node', opts, 4, done);
        });

        beforeEach(() => {
          return manager.upgrade().then(res => {
            result = res;
          });
        });

        it('updates its versions to the latest versions available', () => {
          return expect(manager.cluster.reload()).to.eventually.include({
            docker_version: config.latestVersions.docker,
            swarm_version:  config.latestVersions.swarm
          });
        });

        it("returns an error for each node not upgrading", () => {
          return manager.cluster.getNodes().then(nodes => {
            return expect(_.map(nodes, node => {
              if (node.state === 'upgrading') { return null; }

              return _.findWhere(result.errors, {
                resource: 'node',
                resource_id: node.id
              });
            })).to.not.be.empty.and.not.include(undefined);
          });
        });

        it('returns an action for each upgrading node', () => {
          return manager.cluster.getNodes().then(nodes => {
            return expect(_.map(nodes, node => {
              if (node.state !== 'upgrading') { return null; }

              return _.findWhere(result.actions, {
                type: 'upgrade',
                completed_at: null,
                last_state: 'in-progress',
                resource: 'node',
                resource_id: node.id
              });
            })).to.not.be.empty.and.not.include(undefined);
          });
        });
      });

    });
  });
});
