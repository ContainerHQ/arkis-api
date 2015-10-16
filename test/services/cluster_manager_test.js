'use strict';

var _ = require('lodash'),
  config = require('../../config'),
  models = require('../../app/models'),
  errors = require('../../app/support').errors,
  services = require('../../app/services');

const VERSIONS = ['docker_version', 'swarm_version'];

describe('ClusterManager Service', () => {
  let manager;

  beforeEach(() => {
    let user = factory.buildSync('user');

    return user.save().then(() => {
      let opts = { user_id: user.id };

      return factory.buildSync('runningCluster', opts).save();
    }).then(cluster => {
      manager = new services.ClusterManager(cluster, user);
    });
  });

  describe(`#getNodes`, () => {
    ['DaemonManager', 'MachineManager'].forEach(service => {
      context('when cluster has nodes', () => {
        beforeEach(done => {
          let opts = { cluster_id: manager.cluster.id };

          factory.createMany('node', opts, 7, done);
        });

        it(`returns all cluster's node ${service}`, () => {
          let expected;

          return manager.cluster.getNodes().then(nodes => {
            expected = _.map(nodes, node => {
              return new services[service](manager.cluster, node, manager.user);
            });
            return manager.getNodes(service);
          }).then(managers => {
            return expect(managers).to.deep.equal(expected);
          });
        });
      });

      context('when cluster is empty', () => {
        it('returns an empty list', () => {
          return manager.getNodes(service).then(managers => {
            return expect(managers).to.be.empty;
          });
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
                name: err.name,
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

  describe('#destroy', () => {
    let clusterId;

    beforeEach(() => {
      clusterId = manager.cluster.id;
    });

    context('when cluster has no nodes', () => {
      beforeEach(() => {
        return manager.destroy();
      });

      itDeletesTheCluster();
    });

    context('when cluster has nodes', () => {
      const NODES_COUNT = 3;

      let nodes;

      beforeEach(done => {
        let opts = { cluster_id: manager.cluster.id };

        factory.createMany('node', opts, NODES_COUNT, (err, clusterNodes) => {
          nodes = clusterNodes;
          done(err);
        });
      });

      context('when every cluster nodes can be delete', () => {
        beforeEach(() => {
          return manager.destroy();
        });

        itDeletesTheCluster();

        it("deletes cluster's nodes", () => {
          return expect(models.Node.findAll({
            where: { id: _.pluck(nodes, 'id') } }
          )).to.eventually.be.empty;
        });
      });

      context("when one cluster node can't be deleted", () => {
        let actualErr, undeletableNode, nodeErr;

        beforeEach(done => {
          undeletableNode = nodes[
            random.integer({ min: 0, max: NODES_COUNT - 1 })
          ];
          nodeErr = random.error();
          undeletableNode.destroy = () => {
            return Promise.reject(nodeErr);
          };
          manager.getNodes = sinon.stub().returns(
            Promise.resolve(_.map(nodes, node => {
              return new services.MachineManager(manager.cluster, node);
            }))
          );
          manager.destroy().then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        it("doesn't delete the cluster", () => {
          return expect(models.Cluster.findById(clusterId))
            .to.eventually.exist;
        });

        it('removes every deletable cluster nodes', () => {
          _.pull(nodes, undeletableNode);

          return expect(models.Node.findAll({
            where: { id: _.pluck(nodes, 'id') } }
          )).to.eventually.be.empty;
        });

        it('returns an error with the cluster node deletion errors', () => {
          let expected = new errors.DeletionError([{
            name: nodeErr.name,
            message: nodeErr.message,
            resource: 'node',
            resource_id: undeletableNode.id
          }]);

          expect(actualErr).to.deep.equal(expected);
        });
      });
    });

    function itDeletesTheCluster() {
      it('deletes the cluster', () => {
        return expect(models.Cluster.findById(clusterId))
          .to.eventually.not.exist;
      });
    }
  });
});
