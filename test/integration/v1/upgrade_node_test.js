'use strict';

let  _ = require('lodash');

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
    context('when node already has the latest version', () => {
      beforeEach(() => {
        let versions = { docker_version: '1.2.3', swarm_version: '1.1.2' };

        return cluster.update(versions).then(() => {
          return node.update(versions);
        });
      });

      it("doesn't upgrade the node and returns an error", done => {
        api.clusters(user).nodes(cluster).upgrade(node.id).expect(409, done);
      });
    });

    context('when cluster has old versions', () => {
      it('upgrades the node to its cluster versions', done => {
        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(204, (err, res) => {
          if (err) { return done(err); }

          expect(node.reload())
            .to.eventually.have.property('state', 'upgrading')
            .notify(done);
        });
      });

      it('update the state of its cluster', done => {
        api.clusters(user).nodes(cluster).upgrade(node.id)
        .expect(204, (err, res) => {
          if (err) { return done(err); }

          expect(cluster.reload())
            .to.eventually.have.property('state', 'upgrading')
            .notify(done);
        });
      });
    });
  });

  context('when node is not running', () => {
    it("returns an error", done => {
      api.clusters(user).nodes(cluster).upgrade(node.id).expect(409, done);
    });
  });

  context('when the user specify an invalid node id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).upgrade(0).expect(404, {}, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).upgrade(node.id).expect(401, {}, done);
    });
  })
});
