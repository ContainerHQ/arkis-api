'use strict';

describe('GET /clusters/:id', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  context('when user has no cluster', () => {
    it('returns an empty cluster json array', done => {
      api.clusters(user).getAll().expect(200, { clusters: [] }, done);
    });
  });

  context('when user has many clusters', () => {
    beforeEach(done => {
      factory.createMany('cluster', { user_id: user.id }, 10, done);
    });

    it('retrieves the user clusters', done => {
      api.clusters(user).getAll().expect(200).end((err, res) => {
        if (err) { return done(err); }

        let clusters = format.allTimestamps(res.body.clusters);

        expect(user.getClusters().then(format.allToJSON))
          .to.eventually.deep.equal(clusters).notify(done);
      });
    });

    context('when user limits the number of results', () => {
      it('retrieves a limited number of cluster', done => {
        let limit = 5;

        api.clusters(user).getAll(`?limit=${limit}`).end((err, res) => {
          if (err) { return done(err); }

          let clusters = format.allTimestamps(res.body.clusters);

          expect(user.getClusters().then(format.allToJSON).then(userClusters => {
            return _.slice(userClusters, 0, limit);
          })).to.eventually.deep.equal(clusters).notify(done);
        });
      });
    });

    context('when user asks for a specific page of records', () => {
      it('retrieves the specified page of cluster records', done => {
        let limit = 3, page = 1;

        api.clusters(user).getAll(`?limit=${limit}&page=${page}`).end((err, res) => {
          if (err) { return done(err); }

          let clusters = format.allTimestamps(res.body.clusters);

          expect(user.getClusters().then(format.allToJSON).then(userClusters => {
            return _.slice(userClusters, limit * page, limit * (page + 1));
          })).to.eventually.deep.equal(clusters).notify(done);
        });
      });
    });

    context('when user filters by strategy', () => {
      let strategy = 'random';

      beforeEach(done => {
        let opts = { strategy: strategy, user_id: user.id };

        factory.createMany('cluster', opts, 3, done);
      });

      it('retrieves only user clusters with the same strategy', done => {
        api.clusters(user).getAll(`?strategy=${strategy}`).end((err, res) => {
          if (err) { return done(err); }

          let clusters = format.allTimestamps(res.body.clusters),
            strategyFilter = { where: { strategy: { $like: strategy } } };

          expect(user.getClusters(strategyFilter).then(format.allToJSON))
            .to.eventually.deep.equal(clusters).notify(done);
        });
      });
    });

    context('when user filters by state', () => {
      let state = 'upgrading';

      beforeEach(done => {
        let clusterOpts = { user_id: user.id };

        factory.createMany('cluster', clusterOpts, 6, (err, clusters) => {
          clusters.forEach(cluster => {
            let nodeOpts = { state: state, cluster_id: cluster.id }

            factory.create('node', nodeOpts, err => {
              if (err) { return done(err) }
            });
            factory.create('runningMasterNode', { cluster_id: cluster.id }, err => {
              if (err) { return done(err) }
            });
          });
          done(err);
        });
      });

      it('retrieves only user clusters with the same state', done => {
        api.clusters(user).getAll(`?state=${state}`).end((err, res) => {
          if (err) { return done(err); }

          let clusters = format.allTimestamps(res.body.clusters);

          expect(user.getClusters().then(format.allToJSON).then(userClusters => {
            return _.filter(userClusters, 'state', state);
          })).to.eventually.deep.equal(clusters).notify(done);
        });
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().getAll().expect(401, {}, done);
    });
  });
});
