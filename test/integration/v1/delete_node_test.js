'use strict';

let models = require('../../../app/models');

describe('DELETE /clusters/:cluster_id/nodes/:node_id', () => {
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
    }).then(() => {
      /*
       * Node must be reloaded to ensure that we have its virtual attributes.
       */
      return node.reload();
    });
  });

  context('when the target node belongs to the cluster', () => {
    it('removes the node', done => {
      api.clusters(user).nodes(cluster).delete(node.id)
      .expect(204, (err, res) => {
        if (err) { return done(err); }

        expect(models.Node.findById(node.id))
          .to.eventually.not.exist
          .notify(done);
      });
    });
  });

  context("when the targeted node doesn't belong to the cluster", () => {
    let defaultUser, defaultCluster;

    beforeEach(() => {
      return models.User.findOne({ where: { id: { $ne: user.id } } })
      .then(user => {
        defaultUser = user;
        return models.Cluster.findOne({ where: { id: { $ne: cluster.id } } })
      }).then(cluster => {
        defaultCluster = cluster;
      });
    });

    it("doesn't delete the node and returns a 404 not found", done => {
      api.clusters(defaultUser).nodes(defaultCluster).delete(node.id)
      .expect(404, (err, res) => {
        if (err) { return done(err); }

        expect(models.Node.findById(node.id))
          .to.eventually.exist
          .notify(done);
      });
    });
  });

  context('when the user specify an invalid node id', () => {
    it('returns a 404 not found ', done => {
      api.clusters(user).nodes(cluster).delete(0).expect(404, {}, done)
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).delete(node.id).expect(401, {}, done);
    });
  });
});
