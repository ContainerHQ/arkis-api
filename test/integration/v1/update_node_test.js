'use strict';

let _ = require('lodash'),
  models = require('../../../app/models');

describe('PATCH /clusters/:cluster_id/nodes/:node_id', () => {
  db.sync();

  let user, cluster, node;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    }).then(() => {
      node = factory.buildSync('runningNode', { cluster_id: cluster.id });
      return node.save();
    });
  });

  it('updates the node attributes', done => {
    let form  = { name: random.string(), master: true, labels: {
        storage: 'hdd', test: 2, env: 'trashtest'
      }},
      expected = _.merge({ last_state: 'updating' }, form);

    api.clusters(user).nodes(cluster).update(node.id).send(form)
    .expect(200, has.one(cluster, 'node', { with: expected }, done));
  });

  context('with invalid attributes', () => {
    let form = { name: null };

    it('returns a bad request status and validation errors', done => {
      api.clusters(user).nodes(cluster).update(node.id).send(form)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(node.update(form))
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });

  context('with empty parameters', () => {
    it("doesn't change the node", done => {
      let expected = node.dataValues;

      api.clusters(user).nodes(cluster).update(node.id).send({})
      .expect(200, has.one(cluster, 'node', { with: expected }, done));
    });
  });

  context('when node is not running', () => {
    beforeEach(() => {
      return node.update({ last_state: 'deploying' });
    });

    it('returns a conflict error', done => {
      api.clusters(user).nodes(cluster).update(node.id).send({ master: true })
      .expect(409, done);
    });
  });

  context('with blacklisted attributes', () => {
    let form, attributes;

    beforeEach(() => {
      form = factory.buildSync('forbiddenNode').dataValues;
      attributes = _.difference(node.attributes,
        ['name', 'master', 'labels', 'last_state']
      );
    });

    it('these attributes are filtered', done => {
      api.clusters(user).nodes(cluster).update(node.id).send(form)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expect(cluster.getNodes({ where: { id: node.id } })
        .then(nodes => {
          return _.first(nodes);
        })).to.eventually.satisfy(has.beenFiltered(node, attributes, false))
           .notify(done);
      });
    });
  });

  context('when node id is invalid', () => {
    it('returns a 404 not found ', done => {
      api.clusters(user).nodes(cluster).update().expect(404, {}, done)
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).update(node.id).expect(401, {}, done);
    });
  });
});
