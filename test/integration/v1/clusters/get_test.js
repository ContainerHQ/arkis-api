'use strict';

let models = require('../../../../app/models');

describe('GET /clusters/:id', () => {
  db.sync();
  db.create(['cluster']);

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
        it('retrieves the cluster informations', done => {
          api.clusters(user).get(cluster[attribute]).expect(200, (err, res) => {
            if (err) { return done(err); }

            let clusterInfos = format.response(res.body.cluster);

            expect(clusterInfos).to.deep.equal(format.serialize(cluster));
            done();
          });
        });
      });

      context("when the targeted cluster doesn't belongs to the user", () => {
        let otherUser;

        beforeEach(() => {
          otherUser = factory.buildSync('user');
          return otherUser.save();
        });

        it('returns a 404 not found', done => {
          api.clusters(otherUser).get(cluster[attribute]).expect(404, done);
        });
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().get(cluster.id).expect(401, done);
    });
  });
});
