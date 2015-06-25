'use strict';

let models = require('../../../app/models');

describe('GET /clusters/:id', () => {
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
    it('retrieves the cluster informations', done => {
      api.clusters(user).get(cluster.id).expect(200).end((err, res) => {
        if (err) { return done(err); }

        let clusterInfos = format.timestamps(res.body.cluster);

        expect(clusterInfos).to.deep.equal(cluster.toJSON());
        done();
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

    it('returns a 404 not found', done => {
      api.clusters(defaultUser).get(cluster.id).expect(404, {}, done);
    });
  });

  context('when the user specify an invalid cluster id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).get(0).expect(404, {}, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().get(cluster.id).expect(401, {}, done);
    });
  });
});
