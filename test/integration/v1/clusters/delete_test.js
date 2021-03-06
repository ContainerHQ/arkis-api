'use strict';

let _ = require('lodash'),
  models = require('../../../../app/models');

describe('DELETE /clusters/:id', () => {
  db.sync();
  db.create(['cluster', 'node']);

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  ['id', 'name'].forEach(attribute => {
    context(`when user specifies the ${attribute}`, () => {
      context('when the targeted cluster belongs to the user', () => {
        it('removes the cluster', done => {
          api.clusters(user).delete(cluster[attribute])
          .expect(204, (err, res) => {
            if (err) { return done(err); }

            expect(models.Cluster.findById(cluster.id))
              .to.eventually.not.exist
              .notify(done);
          });
        });

        context('when cluster has some nodes', () => {
          let nodeIds;

          beforeEach(done => {
            let opts = { cluster_id: cluster.id };

            factory.createMany('node', opts, 3, (err, nodes) => {
              nodeIds = _.pluck(nodes, 'id');
              done(err);
            });
          });

          it('destroys these nodes', done => {
            api.clusters(user).delete(cluster[attribute])
            .expect(204, (err, res) => {
              if (err) { return done(err); }

              let criterias = { where: { id: nodeIds } };

              expect(models.Node.findAll(criterias))
                .to.eventually.be.empty
                .notify(done);
            });
          });
        });
      });

      context("when the targeted cluster doesn't belongs to the user", () => {
        let otherUser;

        beforeEach(() => {
          otherUser = factory.buildSync('user');
          return otherUser.save();
        });

        it("doesn't delete the cluster and returns a 404 not found", done => {
          api.clusters(otherUser).delete(cluster[attribute])
          .expect(404, (err, res) => {
            if (err) { return done(err); }

            expect(models.Cluster.findById(cluster.id))
              .to.eventually.exist
              .notify(done);
          });
        });
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().delete(cluster.id).expect(401, done);
    });
  });
});
