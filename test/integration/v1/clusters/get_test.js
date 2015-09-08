'use strict';

let models = require('../../../../app/models');

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

  context('when the targeted cluster belong to the user', () => {
    it('retrieves the cluster informations', done => {
      api.clusters(user).get(cluster.id).expect(200, (err, res) => {
        if (err) { return done(err); }

        let clusterInfos = format.response(res.body.cluster);

        expect(clusterInfos).to.deep.equal(format.serialize(cluster));
        done();
      });
    });
  });

  context("when the targeted cluster doesn't belong to the user", () => {
    let otherUser;

    beforeEach(() => {
      otherUser = factory.buildSync('user');
      return otherUser.save();
    });

    it('returns a 404 not found', done => {
      api.clusters(otherUser).get(cluster.id).expect(404, {}, done);
    });
  });

  context('when the user specify an invalid cluster id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).get(0).expect(404, done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().get(cluster.id).expect(401, done);
    });
  });
});
