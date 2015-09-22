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
    let actualErr, result, previousVersions;

    beforeEach(done => {
      let opts = { cluster_id: manager.cluster.id };

      factory.createMany('runningNode', opts, 5, done);
    });

    context('when cluster is not running', () => {
      beforeEach(() => {
        return manager.cluster.update({ last_state: 'updating' });
      });

      managerUpgrade({ mustFail: true });

      it('returns a state error', () => {
        let expected = new errors.StateError('upgrade', manager.cluster.state);

        expect(actualErr).to.deep.equal(expected);
      });

      itHasSameVersionsThanBefore();
      itDoesntUpgradeItsNodes()
    });

    context('when cluster already has the latest versions', () => {
      managerUpgrade({ mustFail: true });

      it('returns an already updraded error', () => {
        expect(actualErr).to.deep.equal(new errors.AlreadyUpgradedError());
      });

      itHasSameVersionsThanBefore();
      itDoesntUpgradeItsNodes()
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
        managerUpgrade({ mustFail: false });

        itUpdatesItsVersionToLatestVersions();
        itReturnsAnActionForUpgradedNodes();

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
      });

      context('when some node upgrades has issues', () => {
        beforeEach(done => {
          let opts = { cluster_id: manager.cluster.id };

          factory.createMany('node', opts, 4, done);
        });

        managerUpgrade({ mustFail: false });

        itUpdatesItsVersionToLatestVersions();
        itReturnsAnActionForUpgradedNodes();

        it("returns an error for each node not upgrading", () => {
          return manager.cluster.getNodes().then(nodes => {
            return expect(_.map(nodes, node => {
              if (node.state === 'upgrading') { return null; }

              let err = new errors.StateError('upgrade', 'deploying');

              return _.findWhere(result.errors, {
                name: _.snakeCase(err.name),
                message: err.message,
                resource: 'node',
                resource_id: node.id
              });
            })).to.not.be.empty.and.not.include(undefined);
          });
        });
      });

      function itUpdatesItsVersionToLatestVersions() {
        it('updates its versions to the latest versions available', () => {
          return expect(manager.cluster.reload()).to.eventually.include({
            docker_version: config.latestVersions.docker,
            swarm_version:  config.latestVersions.swarm
          });
        });
      }

      function itReturnsAnActionForUpgradedNodes() {
        it('returns an action for each upgraded node', () => {
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
      }
    });

    function managerUpgrade({ mustFail }) {
      beforeEach(done => {
        previousVersions = _.pick(manager.cluster, VERSIONS);

        return manager.upgrade().then(res => {
          if (mustFail) { return done('Upgrade must fail!'); }

          result = res;
          done();
        }).catch(err => {
          if (!mustFail) { return done('Upgrade must not fail!'); }

          actualErr = err;
          done();
        });
      });
    }

    function itHasSameVersionsThanBefore() {
      it('has the same versions than before', () => {
        expect(manager.cluster).to.include(previousVersions);
      });
    }

    function itDoesntUpgradeItsNodes() {
      it("doesnt' upgrade its nodes", () => {
        return manager.cluster.getNodes().then(nodes => {
          return expect(_.all(nodes, node => {
            return node.state === 'upgrading';
          })).to.be.false;
        });
      });
    }
  });
});
