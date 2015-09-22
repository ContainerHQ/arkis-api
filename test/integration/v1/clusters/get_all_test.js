'use strict';

let _ = require('lodash');

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0,
      CLUSTER_COUNT  = DEFAULT_LIMIT + 1;

describe('GET /clusters/', () => {
  db.sync();
  db.create(['cluster']);

  let user;

  beforeEach(done => {
    user = factory.buildSync('user');
    user.save().then(() => {
      factory.createMany('cluster', { user_id: user.id }, CLUSTER_COUNT, done);
    }).catch(done);
  });

  it('retrieves the user clusters', done => {
    let opts = { limit: DEFAULT_LIMIT, offset: DEFAULT_OFFSET };

    /*
     * Opts are not in the query string on purpose to test default values
     */
    api.clusters(user).getAll()
    .expect(200, has.many(user, 'clusters', opts, done));
  });

  context('when user limits the number of results', () => {
    let opts = { limit: 5, offset: DEFAULT_OFFSET };

    it('retrieves a limited number of cluster', done => {
      api.clusters(user).getAll(opts)
      .expect(200, has.many(user, 'clusters', opts, done));
    });

    context('with a negative limit', () => {
      it('returns a bad request error', done => {
        api.clusters(user).getAll({ limit: -1 }).expect(400, done);
      });
    });
  });

  context('when user asks for a specific offset of records', () => {
    let opts = { limit: 3, offset: 4 };

    it('retrieves the specified offset of cluster records', done => {
      api.clusters(user).getAll(opts)
      .expect(200, has.many(user, 'clusters', opts, done));
    });

    context('with a negative offset', () => {
      it('returns a bad request error', done => {
        api.clusters(user).getAll({ offset: -1 }).expect(400, done);
      });
    });
  });

  [
    ['strategy', 'random'],
    ['strategy', 'binpack'],
    ['strategy', 'spread'],
    ['name', 'whatever'],
    ['name', 'john-doe'],
    ['state', 'unreachable'],
    ['state', 'running'],
  ].forEach(([name, value]) => {
    context(`when user filters with ${value} ${name}`, () => {
      let opts = {};

      beforeEach(done => {
        let number = name === 'name' ? 1 : 3,
          factoryName = name === 'state' ? `${value}Cluster` : 'cluster';

        opts[name] = value;
        opts.user_id = user.id;

        factory.createMany(factoryName, opts, number, done);
      });

      it(`retrieves only user clusters with ${value} ${name}`, done => {
        api.clusters(user).getAll(opts)
        .expect(200, has.manyFiltered('clusters', name, value, done));
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().getAll().expect(401, done);
    });
  });
});
