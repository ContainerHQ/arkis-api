'use strict';

let _ = require('lodash'),
  moment = require('moment');

const DEFAULT_LIMIT  = 25,
      DEFAULT_OFFSET = 0,
      ACTION_COUNT   = DEFAULT_LIMIT + 1,
      TIMELINE_SCOPE = [['started_at', 'id'],['desc', 'asc']];

describe('GET /clusters/:cluster_id/nodes/:node_id/actions/', () => {
  db.sync();
  db.create(['cluster', 'node', 'action']);

  let user, cluster, node;

  beforeEach(done => {
    user = factory.buildSync('user');
    user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      node = factory.buildSync('node', { cluster_id: cluster.id });
      return node.save();
    }).then(() => {
      /*
       * We need to ensure that our actions are properly ordered by started_at.
       */
      let opts = { resource: 'node', resource_id: node.id,
        started_at: function() {
          return moment().subtract(random.positiveInt(20), 'seconds')
        }
      };
      factory.createMany('action', opts, ACTION_COUNT, done);
    }).catch(done);
  });

  it('retrieves the node actions', done => {
    let opts = { limit: 25, offset: DEFAULT_OFFSET };

    api.clusters(user).nodes(cluster).actions(node).getAll()
    .expect(200, has.many(node, 'actions', _.merge(opts, {
      order: TIMELINE_SCOPE
    }), done));
  });

  context('when user limits the number of results', () => {
    let opts = { limit: 5, offset: DEFAULT_OFFSET };

    it('retrieves a limited number of actions', done => {
      api.clusters(user).nodes(cluster).actions(node).getAll(opts)
      .expect(200, has.many(node, 'actions', _.merge(opts, {
        order: TIMELINE_SCOPE
      }), done));
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
      .expect(200, has.many(node, 'actions', _.merge(opts, {
        order: TIMELINE_SCOPE
      }), done));
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
