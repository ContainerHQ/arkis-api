'use strict';

describe('GET /clusters/', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  context('when user has no cluster', () => {
    it('returns an empty cluster list', done => {
      api.clusters(user).getAll().expect(200, {
        meta: {
          limit: 25,
          offset: 0,
          total_count: 0
        },
        clusters: []
      }, done);
    });
  });

  context('when user has many clusters', () => {
    let clusterCount = 10;

    beforeEach(done => {
      factory.createMany('cluster', { user_id: user.id }, clusterCount, done);
    });

    it('retrieves the user clusters', done => {
      api.clusters(user).getAll().expect(200).end((err, res) => {
        if (err) { return done(err); }

        let clusters = format.allTimestamps(res.body.clusters);

        expect(res.body.meta).to.deep.equal({
          limit: 25,
          offset: 0,
          total_count: clusterCount
        });
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

          expect(res.body.meta).to.deep.equal({
            limit: limit,
            offset: 0,
            total_count: clusterCount
          });
          expect(user.getClusters().then(format.allToJSON).then(userClusters => {
            return _.slice(userClusters, 0, limit);
          })).to.eventually.deep.equal(clusters).notify(done);
        });
      });

      context('with a negative limit', () => {
        it('returns a bad request error', done => {
          api.clusters(user).getAll('?limit=-1').expect(400).end(done);
        });
      });
    });

    context('when user asks for a specific offset of records', () => {
      it('retrieves the specified an offset of cluster records', done => {
        let limit = 3, offset = 3;

        api.clusters(user).getAll(`?limit=${limit}&offset=${offset}`)
        .end((err, res) => {
          if (err) { return done(err); }

          let clusters = format.allTimestamps(res.body.clusters);

          expect(res.body.meta).to.deep.equal({
            limit: limit,
            offset: offset,
            total_count: clusterCount
          });
          expect(user.getClusters().then(format.allToJSON).then(userClusters => {
            return _.slice(userClusters, offset, offset + limit);
          })).to.eventually.deep.equal(clusters).notify(done);
        });
      });

      context('with a negative offset', () => {
        it('returns a bad request error', done => {
          api.clusters(user).getAll('?offset=-1').expect(400).end(done);
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

          expect(_.every(res.body.clusters, cluster => {
            return cluster.strategy === strategy;
          }));
          done();
        });
      });
    });

    context('when user filters by name', () => {
      let name = 'filter-production';

      beforeEach(done => {
        let opts = { name: name, user_id: user.id };

        factory.createMany('cluster', opts, 3, done);
      });

      it('retrieves only user clusters with the same name', done => {
        api.clusters(user).getAll(`?name=${name}`)
        .end((err, res) => {
          if (err) { return done(err); }

          expect(_.every(res.body.clusters, cluster => {
            return cluster.name === name;
          }));
          done();
        });
      });
    });

    context('when user filters by state', () => {
      beforeEach(done => {
        let opts = { user_id: user.id };

        factory.createMany('unreachableCluster', opts, 6, done);
      });

      it('retrieves only user clusters with the same state', done => {
        api.clusters(user).getAll(`?state=unreachable`)
        .end((err, res) => {
          if (err) { return done(err); }

          expect(_.every(res.body.clusters, cluster => {
            return cluster.state === 'unreachable';
          }));
          done();
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
