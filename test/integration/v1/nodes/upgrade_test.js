'use strict';

let  _ = require('lodash'),
  config = require('../../../../config');

describe('POST /clusters/:cluster_id/nodes/:node_id/upgrade', () => {
  db.sync();

  let user, cluster, node;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      node = factory.buildSync('node', { cluster_id: cluster.id });
      return node.save();
    });
  });

  context('when node is running', () => {
    beforeEach(() => {
      return node.update({ last_state: 'running', last_ping: Date.now() });
    });

    /*
     * To verify that our node is properly updated with its cluster versions,
     * we are changing the cluster version to an oldest version.
     */
    context('when node already has the same versions than its cluster', () => {
      beforeEach(() => {
        let versions = {
          docker_version: config.oldestVersions.docker,
          swarm_version:  config.oldestVersions.swarm
        };

        return cluster.update(versions).then(() => {
          return node.update(versions);
        });
      });

      it("doesn't upgrade the node and returns an error", done => {
        api.clusters(user).nodes(cluster).upgrade(node.id).expect(409, done);
      });
    });

    context('when node has different versions than its cluster', () => {
      beforeEach(() => {
        let versions = {
          docker_version: config.oldestVersions.docker,
          swarm_version:  config.oldestVersions.swarm
        };
        return node.update(versions);
      });

      it('upgrades the node to its cluster versions', done => {
        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(202, (err, res) => {
          if (err) { return done(err); }

          expect(node.reload())
            .to.eventually.have.property('state', 'upgrading')
            .notify(done);
        });
      });

      it('update the state of its cluster', done => {
        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(202, (err, res) => {
          if (err) { return done(err); }

          expect(cluster.reload())
            .to.eventually.have.property('state', 'upgrading')
            .notify(done);
        });
      });

      it('returns the updating node', done => {
        let expected = _.merge(node.dataValues, { last_state: 'upgrading' });

        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(202, has.one(cluster, 'node', { with: expected }, done));
      });

      it('returns a node upgrade action', done => {
        let expected = {
          type: 'upgrade',
          state: 'in-progress',
          resource: 'node',
          resource_id: node.id,
          completed_at: null
        };

        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(202, has.one(node, 'action', { with: expected }, done));
      });
    });
  });

  context('when node is not running', () => {
    it("returns an error", done => {
      api.clusters(user).nodes(cluster).upgrade(node.id).expect(409, done);
    });
  });

  context('when node id is invalid', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).upgrade(0).expect(404, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).upgrade(node.id).expect(401, done);
    });
  })
});
