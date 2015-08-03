'use strict';

let _ = require('lodash');

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0,
      NODES_COUNT    = DEFAULT_LIMIT + 1;

describe('GET /clusters/:cluster_id/nodes', () => {
  db.sync();

  let user, cluster;

  beforeEach(done => {
    user = factory.buildSync('user');

    user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      factory.createMany('node', { cluster_id: cluster.id }, NODES_COUNT, done);
    }).catch(done);
  });

  it('retrieves the cluster nodes', done => {
    let opts = { limit: DEFAULT_LIMIT, offset: DEFAULT_OFFSET };

    api.clusters(user).nodes(cluster).getAll()
    .expect(200, has.many(cluster, 'nodes', opts, done));
  });

  context('when user limits the number of results', () => {
    let opts = { limit: 5, offset: DEFAULT_OFFSET };

    it('retrieves a limited number of nodes', done => {
      api.clusters(user).nodes(cluster).getAll(`?limit=${opts.limit}`)
      .expect(200, has.many(cluster, 'nodes', opts, done));
    });

    context('with a negative limit', () => {
      it('returns a bad request error', done => {
        api.clusters(user).nodes(cluster).getAll('?limit=-1')
        .expect(400).end(done);
      });
    });
  });

  context('when user asks for a specific offset of records', () => {
    let opts = { limit: 3, offset: 4 };

    it('retrieves the specified offset of nodes records', done => {
      api.clusters(user).nodes(cluster)
      .getAll(`?limit=${opts.limit}&offset=${opts.offset}`)
      .expect(200, has.many(cluster, 'nodes', opts, done));
    });

    context('with a negative offset', () => {
      it('returns a bad request error', done => {
        api.clusters(user).getAll('?offset=-1').expect(400).end(done);
      });
    });
  });

  [
    ['region', 'paris'],
    ['master', true],
    ['master', false],
    ['region', 'london'],
    ['byon', true],
    ['byon', false],
    ['name', 'whatever'],
    ['state', 'unreachable'],
    ['state', 'running'],
    ['node_size', 'giant'],
    ['node_size', 'small']
  ].forEach(([name, value]) => {
    context(`when user filters with ${value} ${name}`, () => {
      beforeEach(done => {
        let opts = { cluster_id: cluster.id },
          number = name === 'name' || name === 'master' ? 1 : 3,
          factoryName = 'node';

        opts[name] = value;

        switch (name) {
          case 'state':
            factoryName = `${value}Node`;
            break;
          case 'byon':
            if (value) {
              factoryName = `byonNode`;
            }
            break;
        }
        factory.createMany(factoryName, opts, number, done);
      });

      it(`retrieves only user cluster nodes with ${value} ${name}`, done => {
        api.clusters(user).nodes(cluster).getAll(`?${name}=${value}`)
        .expect(200, has.manyFiltered('nodes', name, value, done));
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).getAll().expect(401, {}, done);
    });
  });
});
