'use strict';

let _ = require('lodash');

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0,
      CLUSTER_COUNT  = DEFAULT_LIMIT + 1;

describe('GET /clusters/', () => {
  db.sync();

  let user;

  beforeEach(done => {
    user = factory.buildSync('user');
    user.save().then(() => {
      factory.createMany('cluster', { user_id: user.id }, CLUSTER_COUNT, done);
    }).catch(done);
  });

  it('retrieves the user clusters', done => {
    api.clusters(user).getAll().expect(200, (err, res) => {
      if (err) { return done(err); }

      expectClusters(user, res.body, DEFAULT_OFFSET, DEFAULT_LIMIT, done);
    });
  });

  context('when user limits the number of results', () => {
    it('retrieves a limited number of cluster', done => {
      let limit = 5;

      api.clusters(user).getAll(`?limit=${limit}`).expect(200, (err, res) => {
        if (err) { return done(err); }

        expectClusters(user, res.body, DEFAULT_OFFSET, limit, done);
      });
    });

    context('with a negative limit', () => {
      it('returns a bad request error', done => {
        api.clusters(user).getAll('?limit=-1').expect(400).end(done);
      });
    });
  });

  context('when user asks for a specific offset of records', () => {
    it('retrieves the specified offset of cluster records', done => {
      let limit = 3, offset = 4;

      api.clusters(user).getAll(`?limit=${limit}&offset=${offset}`)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expectClusters(user, res.body, offset, limit, done);
      });
    });

    context('with a negative offset', () => {
      it('returns a bad request error', done => {
        api.clusters(user).getAll('?offset=-1').expect(400).end(done);
      });
    });
  });

  function expectClusters(user, infos, offset, limit, done) {
    let clusters = format.allTimestamps(infos.clusters);

    user.getClusters().then(format.allToJSON).then(userClusters => {
      expect(infos.meta).to.deep.equal({
        limit: limit,
        offset: offset,
        total_count: userClusters.length
      });
      return _.slice(userClusters, offset, offset + limit);
    }).then(userClusters => {
      expect(clusters).to.deep.equal(userClusters);
      done();
    }).catch(done);
  };

  [
    ['strategy', 'random'],
    ['strategy', 'binpack'],
    ['strategy', 'spread'],
    ['name', 'whatever'],
    ['state', 'unreachable'],
    ['state', 'running'],
  ].forEach(([name, value]) => {
    context(`when user filters with ${value} ${name}`, () => {
      beforeEach(done => {
        let opts = { user_id: user.id },
          number = name === 'name' ? 1 : 3,
          factoryName = name === 'state' ? `${value}Cluster` : 'cluster';

        opts[name] = value;

        factory.createMany(factoryName, opts, number, done);
      });

      it(`retrieves only user clusters with ${value} ${name}`, done => {
        api.clusters(user).getAll(`?${name}=${value}`)
        .expect(200, (err, res) => {
          if (err) { return done(err); }

          expectClustersBy(user, res.body, name, value, done);
        });
      });
    });
  });

  function expectClustersBy(user, infos, attribute, value, done) {
    if (_.isEmpty(infos.clusters)) {
      return done(new Error('Clusters is empty!'));
    }

    expect(_.all(infos.clusters, cluster => {
      return cluster[attribute] === value;
    })).to.be.true;
    done();
  }

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().getAll().expect(401, {}, done);
    });
  });
});
