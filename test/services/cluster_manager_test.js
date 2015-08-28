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

  describe('#getNodesDaemons', () => {
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
          return manager.getNodesDaemons();
        }).then(daemons => {
          return expect(daemons).to.deep.equal(expected);
        });
      });
    });

    context('when cluster is empty', () => {
      it('returns an empty list', () => {
        return manager.getNodesDaemons().then(daemons => {
          return expect(daemons).to.be.empty;
        });
      });
    });

  });

  describe('#upgrade', () => {
    let nodeDaemons;

    beforeEach(() => {
      nodeDaemons = _.map(new Array(5), () => {
        return { upgrade: sinon.stub() };
      });
      manager.getNodesDaemons = function() {
        return Promise.resolve(nodeDaemons);
      };
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

      it("doenst' upgrade all the nodes", () => {
        nodeDaemons.forEach(daemon => {
          expect(daemon.upgrade).to.not.have.been.called;
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

      it("doenst' upgrade all the nodes", () => {
        nodeDaemons.forEach(daemon => {
          expect(daemon.upgrade).to.not.have.been.called;
        });
      });
    });

    context('when cluster has older versions', () => {
      const OLDEST_VERSIONS = {
        docker_version: config.oldestVersions.docker,
        swarm_version:  config.oldestVersions.swarm
      };

      beforeEach(() => {
        return manager.cluster.update(OLDEST_VERSIONS).then(() => {
          return manager.upgrade();
        }).then(() => {
          return manager.cluster.reload();
        });
      });

      it('updates its verions to the latest versions available', () => {
        expect(manager.cluster).to.include({
          docker_version: config.latestVersions.docker,
          swarm_version:  config.latestVersions.swarm
        });
      });

      it('upgrades all the nodes', () => {
        nodeDaemons.forEach(daemon => {
          expect(daemon.upgrade).to.have.been.called;
        });
      });
    });
  });
});
