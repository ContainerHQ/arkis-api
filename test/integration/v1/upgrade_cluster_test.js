'use strict';

let  _ = require('lodash'),
  config = require('../../../config');

describe('POST /clusters/:cluster_id/upgrade', () => {
  db.sync();

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  context('when cluster is running', () => {
    beforeEach(() => {
      return cluster.update({ last_state: 'running', last_ping: Date.now() });
    });

    context('when cluster already has the latest version', () => {
      beforeEach(() => {
        let versions = {
          docker_version: config.latestVersions.docker,
          swarm_version:  config.latestVersions.swarm
        };
        return cluster.update(versions);
      });

      it("doesn't upgrade the cluster and returns an error", done => {
        api.clusters(user).upgrade(cluster.id).expect(409, done);
      });
    });

    context('when cluster has older versions', () => {
      beforeEach(() => {
        let versions = {
          docker_version: config.oldestVersions.docker,
          swarm_version:  config.oldestVersions.swarm
        };
        return cluster.update(versions);
      });

      it('upgrades and returns the cluster', done => {
        api.clusters(user).upgrade(cluster.id)
        .expect(202, (err, res) => {
          if (err) { return done(err); }

          let clusterInfos = format.timestamps(res.body.cluster);

          cluster.reload().then(() => {
            expect(clusterInfos)
              .to.deep.equal(cluster.toJSON()).and
              .to.satisfy(has.latestVersions);
            done();
          }).catch(done);
        });
      });

      context('when cluster has no upgradable nodes', () => {
        it("doesn't set the cluster state to upgrading", done => {
          api.clusters(user).upgrade(cluster.id)
          .expect(202, (err, res) => {
            if (err) { return done(err); }

            expect(res.body.cluster.state).to.not.equal('upgrading');
            done();
          });
        });
      });

      context('when some cluster nodes can be upgraded', () => {
        beforeEach(done => {
          let opts = { cluster_id: cluster.id };

          factory.createMany('runningNode', opts, 5, done);
        });

        it('returns node upgrade actions', done => {
          api.clusters(user).upgrade(cluster.id)
          .expect(202, (err, res) => {
            if (err) { return done(err); }

            let actions = format.allTimestamps(res.body.actions);

            expect(actions).to.not.be.empty;
            done();
          });
        });

        it('returns no error', done => {
          api.clusters(user).upgrade(cluster.id)
          .expect(202, (err, res) => {
            if (err) { return done(err); }

            expect(res.body.errors).to.be.empty;
            done();
          });
        });

        it('set the cluster state to upgrading', done => {
          api.clusters(user).upgrade(cluster.id)
          .expect(202, (err, res) => {
            if (err) { return done(err); }

            expect(res.body.cluster.state).to.equal('upgrading');
            done();
          });
        });

        context("when some cluster nodes can't be upgraded", () => {
          beforeEach(done => {
            let opts = { cluster_id: cluster.id };

            factory.createMany('node', opts, 4, done);
          });

          it('returns node errors', done => {
            api.clusters(user).upgrade(cluster.id)
            .expect(202, (err, res) => {
              if (err) { return done(err); }

              expect(res.body.errors).to.not.be.empty;
              done();
            });
          });
        });
      });
    });
  });

  context('when cluster is not running', () => {
    it("doesn't upgrade the cluster and returns an error", done => {
      api.clusters(user).upgrade(cluster.id).expect(409, done);
    });
  });

  context('when cluster id is invalid', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).upgrade(0).expect(404, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().upgrade(cluster.id).expect(401, done);
    });
  })
});
