'use strict';

let models = require('../../../../app/models');

describe('GET /clusters/:cluster_id/nodes/:node_id', () => {
  db.sync();

  let user, cluster, node;

  beforeEach(() => {
    user    = factory.buildSync('user');
    cluster = factory.buildSync('cluster');
    node    = factory.buildSync('node');

    return user.save().then(() => {
      return user.addCluster(cluster);
    }).then(() => {
      return cluster.addNode(node);
    }).then(() => {
      /*
       * Node must be reloaded to ensure that we have its virtual attributes.
       */
      return node.reload();
    });
  });

  ['id', 'name'].forEach(attribute => {
    context(`when user specifies the ${attribute}`, () => {
      context('when the targeted node belongs to the cluster', () => {
        it('retrieves the user informations', done => {
          api.clusters(user).nodes(cluster).get(node[attribute])
          .expect(200, (err, res) => {
            if (err) { return done(err); }

            let nodeInfos = format.response(res.body.node);

            expect(nodeInfos).to.deep.equal(format.serialize(node));
            done();
          });
        });
      });

      context("when the targeted node doesn't belongs to the cluster", () => {
        let otherCluster;

        beforeEach(() => {
          otherCluster = factory.buildSync('cluster');
          return user.addCluster(otherCluster);
        });

        it('returns a 404 not found', done => {
          api.clusters(user).nodes(otherCluster).get(node[attribute])
          .expect(404, done);
        });
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).get(node.id).expect(401, done);
    });
  });
});
