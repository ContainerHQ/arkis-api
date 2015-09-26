'use strict';

describe('GET /clusters/:cluster_id/nodes/:node_id/actions/:action_id', () => {
  db.sync();
  db.create(['cluster', 'node', 'action']);

  let user, cluster, node, action;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      node = factory.buildSync('node', { cluster_id: cluster.id });
      return node.save();
    }).then(() => {
      return node.createAction({ type: 'deploy' });
    }).then(nodeAction => {
      action = nodeAction;
    });
  });

  context('when action belongs to the node', () => {
    it('returns the action informations', done => {
      api.clusters(user).nodes(cluster).actions(node).get(action.id)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        let actionInfos = format.response(res.body.action);

        expect(actionInfos).to.deep.equal(format.serialize(action));
        done()
      });
    });
  });

  context('when action belongs to another resource type', () => {
    let otherAction;

    beforeEach(() => {
      otherAction = factory.buildSync('action', {
        type: 'upgrade', resource: 'cluster', resource_id: cluster.id
      });
      return otherAction.save();
    });

    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).actions(node).get(otherAction.id)
      .expect(404, done);
    });
  });

  context('when action belongs to another node', () => {
    let otherAction;

    beforeEach(() => {
      return factory.buildSync('node').save().then(otherNode => {
        otherAction = factory.buildSync('action', {
          type: 'upgrade', resource: 'cluster', resource_id: otherNode.id
        });
        return otherAction.save();
      });
    });

    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).actions(node).get(otherAction.id)
      .expect(404, done);
    });
  });

  context('when the user specify an invalid action id', () => {
    it('returns a 404 not found', done => {
      api.clusters(user).nodes(cluster).actions(node).get(0).expect(404, done);
    });
  })

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).actions(node).get(action).expect(401, done);
    });
  });
});
