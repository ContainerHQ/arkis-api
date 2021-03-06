'use strict';

let _ = require('lodash'),
  models = require('../../../../app/models');

describe('DELETE /clusters/:cluster_id/nodes/:node_id', () => {
  db.sync();
  db.create(['cluster', 'node', 'action']);

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

  ['id', 'name'].forEach(attribute => {
    context(`when user specifies the ${attribute}`, () => {
      context('when the target node belongs to the cluster', () => {
        it('removes the node', done => {
          api.clusters(user).nodes(cluster).delete(node[attribute])
          .expect(204, (err, res) => {
            if (err) { return done(err); }

            expect(models.Node.findById(node.id))
              .to.eventually.not.exist
              .notify(done);
          });
        });

        context('when node has actions', () => {
          let actionIds;

          beforeEach(done => {
            let opts = { type: 'deploy', resource: 'node', resource_id: node.id };

            factory.createMany('action', opts, 10, (err, actions) => {
              if (err) { return done(err); }

              actionIds = _.pluck(actions, 'id');
              done();
            });
          });

          it('removes the node actions', done => {
            api.clusters(user).nodes(cluster).delete(node[attribute])
            .expect(204, (err, res) => {
              if (err) { return done(err); }
                expect(models.Action.findAll({ where: { id: actionIds } }))
                  .to.eventually.be.empty
                  .notify(done);
            });
          });
        });
      });

      context("when the targeted node doesn't belongs to the cluster", () => {
        let otherCluster;

        beforeEach(() => {
          otherCluster = factory.buildSync('cluster', { user_id: user.id });
          return otherCluster.save();
        });

        it("doesn't delete the node and returns a 404 not found", done => {
          api.clusters(user).nodes(otherCluster).delete(node[attribute])
          .expect(404, (err, res) => {
            if (err) { return done(err); }

            expect(models.Node.findById(node.id))
              .to.eventually.exist
              .notify(done);
          });
        });
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).delete(node.id).expect(401, done);
    });
  });
});
