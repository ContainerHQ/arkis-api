'use strict';

let _ = require('lodash'),
  models = require('../../../../app/models');

describe('DELETE /account/', () => {
  db.sync();
  db.create(['user', 'profile']);

  let user, profileId, password;

  beforeEach(() => {
    user     = factory.buildSync('user');
    password = user.password;
    return user.save().then(() => {
      return user.getProfile();
    }).then(profile => {
      profileId = profile.id;
    });
  });

  it('destroys the user account', done => {
    api.account(user).cancel()
    .field('password', password)
    .expect(204, (err, res) => {
      if (err) { return done(err); }

      expect(models.User.findOne({ where: { email: user.email } }))
        .to.eventually.not.exist
        .notify(done);
    });
  });

  it('destroys the user profile', done => {
    api.account(user).cancel()
    .field('password', password)
    .expect(204, (err, res) => {
      if (err) { return done(err); }

      expect(models.Profile.findById(profileId))
        .to.eventually.not.exist
        .notify(done);
    });
  });

  context('when user has some clusters', () => {
    let clusterIds;

    beforeEach(done => {
      let opts = { user_id: user.id };

      factory.createMany('cluster', opts, 5, (err, clusters) => {
        clusterIds = _.pluck(clusters, 'id');
        done(err);
      });
    });

    it('destroys the user profile', done => {
      api.account(user).cancel()
      .field('password', password)
      .expect(204, (err, res) => {
        if (err) { return done(err); }

        let criterias = { where: { id: clusterIds } };

        expect(models.Cluster.findAll(criterias))
          .to.eventually.be.empty
          .notify(done);
      });
    });
  });

  context('with incorrect password', () => {
    it('returns a forbidden status', done => {
      api.account(user).cancel()
      .field('password', `${password}*`)
      .expect(403, (err, res) => {
        if (err) { return done(err); }

        expect(models.User.findOne({ where: { email: user.email } }))
          .to.eventually.exist
          .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.account().cancel().expect(401, done);
    });
  });
});
