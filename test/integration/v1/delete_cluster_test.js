'use strict';

let models = require('../../../app/models');

describe('DELETE /clusters/:id', () => {
  db.sync();

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  context('when the cluster exist for this user', () => {
    it('removes the cluster', done => {
      api.clusters(user).delete(cluster.id)
      .expect(204).end((err, res) => {
        if (err) { return done(err); }

        expect(models.Cluster.findById(cluster.id))
          .to.eventually.be.null
          .notify(done);
      });
    });
  });

  context("when the cluster doesn't belong to the user", () => {
    let defaultUser;

    beforeEach(() => {
      return models.User.findOne({ where: { id: { $ne: user.id } } })
      .then(user => {
        defaultUser = user;
      });
    });

    it('returns a 404 error', done => {
      api.clusters(defaultUser).delete(cluster.id)
      .expect(404).end((err, res) => {
        if (err) { return done(err); }

        expect(models.Cluster.findById(cluster.id))
          .to.eventually.be.not.null
          .notify(done);
      });
    });
  });

  context('when the user specify an invalid cluster id', () => {
    it('returns ', done => {
      api.clusters(user).delete('whatever').expect(404, {}, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().delete(cluster.id).expect(401, {}, done);
    });
  });
});
