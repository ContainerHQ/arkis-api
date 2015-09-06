'use strict';

let _ = require('lodash');

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0,
      ACTION_COUNT   = DEFAULT_LIMIT + 1;

describe('GET /clusters/:cluster_id/nodes/:node_id/actions/', () => {
  db.sync();

  let user, cluster, node;

  beforeEach(done => {
    user    = factory.buildSync('user');
    cluster = factory.buildSync('cluster');
    node    = factory.buildSync('node');

    user.save().then(() => {
      return user.addCluster(cluster);
    }).then(() => {
      return cluster.addNode(node);
    }).then(() => {
      let opts = { resource: 'node', resource_id: node.id };

      factory.createMany('action', opts, ACTION_COUNT, done);
    }).catch(done);
  });

  it('retrieves the node actions', done => {
    let opts = { limit: DEFAULT_LIMIT, offset: DEFAULT_OFFSET };

    api.clusters(user).nodes(cluster).actions(node).getAll()
    .expect(200, has.many(node, 'actions', opts, done));
  });

  context('when user limits the number of results', () => {
    let opts = { limit: 5, offset: DEFAULT_OFFSET };

    it('retrieves a limited number of actions', done => {
      api.clusters(user).nodes(cluster).actions(node).getAll(opts)
      .expect(200, has.many(node, 'actions', opts, done));
    });

    context('with a negative limit', () => {
      it('returns a bad request error', done => {
        api.clusters(user).nodes(cluster).actions(node).getAll({ limit: -1 })
        .expect(400, done);
      });
    });
  });

  context('when user asks for a specific offset of records', () => {
    let opts = { limit: 3, offset: 4 };

    it('retrieves the specified offset of action records', done => {
      api.clusters(user).nodes(cluster).actions(node).getAll(opts)
      .expect(200, has.many(node, 'actions', opts, done));
    });

    context('with a negative offset', () => {
      it('returns a bad request error', done => {
        api.clusters(user).nodes(cluster).actions(node).getAll({ offset: -1 })
        .expect(400, done);
      });
    });
  });

  [
    ['type', 'deploy'],
    ['type', 'update'],
    ['type', 'upgrade'],
    ['state', 'in-progress'],
    ['state', 'completed'],
    ['state', 'errored']
  ].forEach(([name, value]) => {
    let title = JSON.stringify(value),
        opts  = {};

    context(`when user filters with ${title} ${name}`, () => {
      beforeEach(done => {
        let factoryName  = name === 'state' ? `${value}Action` : 'action';

        opts[name]       = value;
        opts.resource    = 'node';
        opts.resource_id = node.id;

        factory.createMany(factoryName, opts, 5, done);
      });

      it(`retrieves only node actions with ${title} ${name}`, done => {
        api.clusters(user).nodes(cluster).actions(node).getAll(opts)
        .expect(200, has.manyFiltered('actions', name, value, done));
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).actions(node).getAll()
      .expect(401, {}, done);
    });
  });
});
