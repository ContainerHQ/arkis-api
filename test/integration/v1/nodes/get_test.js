'use strict';

let models = require('../../../../app/models');

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
       * Node must be reloaded to ensure that we have its virtual attributes.
       */
      return node.reload();
    });
  });

  context('when the targeted node belongs to the cluster', () => {
    it('retrieves the user informations', done => {
      api.clusters(user).nodes(cluster).get(node.id)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        let nodeInfos = format.response(res.body.node);

        expect(nodeInfos).to.deep.equal(format.serialize(node));
        done();
      });
    });
  });

  context("when the targeted node doesn't belong to the cluster", () => {
    let otherCluster;

    beforeEach(() => {
      otherCluster = factory.buildSync('cluster', { user_id: user.id });
      return otherCluster.save();
    });

    it('returns a 404 not found', done => {
      api.clusters(user).nodes(otherCluster).get(node.id)
      .expect(404, done);
    });
  });

  context('when the user specify an invalid node id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).get(0).expect(404, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).get(node.id).expect(401, done);
    });
  });
});
