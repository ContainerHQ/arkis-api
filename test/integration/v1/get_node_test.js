'use strict';

let models = require('../../../app/models');

describe('GET /clusters/:cluster_id/nodes/:node_id', () => {
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
       * Node must be reload to ensure that we have the virtual attributes.
       */
      return node.reload();
    });
  });

  context('when the target node belongs to the cluster', () => {
    it('retrieves the user informations', done => {
      api.clusters(user).nodes(cluster).get(node.id)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        let nodeInfos = format.timestamps(res.body.node);

        expect(nodeInfos).to.deep.equal(node.toJSON());
        done();
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

    it('returns a 404 not found', done => {
      api.clusters(defaultUser).nodes(defaultCluster).get(node.id)
      .expect(404, {}, done);
    });
  });

  context('when the user specify an invalid node id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).get(0).expect(404, {}, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).get(node.id).expect(401, {}, done);
    });
  });
});
