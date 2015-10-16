'use strict';

let _ = require('lodash'),
  models = require('../../../../app/models');

describe('PATCH /clusters/:cluster_id', () => {
  db.sync();

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  it('updates the node attributes', done => {
    let form = { name: 'test-cluster' };

    api.clusters(user).update(cluster.id).send(form)
    .expect(200, has.one(user, 'cluster', { with: form }, done));
  });

  context('with strategy and a master node', () => {
    let form, node;

    beforeEach(() => {

      let opts = { master: true, cluster_id: cluster.id };

      form = { strategy: 'random' };
      node = factory.buildSync('runningNode', opts);
      return node.save();
    });

    it('returns a node update action', done => {
      api.clusters(user).update(cluster.id).send(form)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expect(res.body.action).to.include({
          state: 'in-progress',
          type: 'update',
          resource: 'node',
          resource_id: node.id
        });
        done();
      });
    });
  });

  context('without strategy', () => {
    it('returns a null action', done => {
      api.clusters(user).update(cluster.id).send({})
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expect(res.body.action).to.be.null;
        done();
      });
    });
  });



  context('with invalid attributes', () => {
    let form = { name: null };

    it('returns a bad request status and validation errors', done => {
      api.clusters(user).update(cluster.id).send(form)
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        cluster.update(form).then(done).catch(err => {
          expect(res.body).to.deep.equal(format.error(err));
        }).then(done).catch(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let form, attributes;

    beforeEach(() => {
      form = factory.buildSync('forbiddenCluster').dataValues;
      attributes = _.difference(cluster.attributes,
        ['name', 'strategy', 'cert', 'created_at', 'updated_at']
      );
    });

    it('these attributes are filtered', done => {
      api.clusters(user).update(cluster.id).send(form)
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        expect(user.getClusters({ where: { id: cluster.id } })
        .then(clusters => {
          return _.first(clusters);
        })).to.eventually.satisfy(has.beenFiltered(cluster, attributes, false))
           .notify(done);
      });
    });
  });

  context('when cluster id is invalid', () => {
    it('returns a 404 not found ', done => {
      api.clusters(user).update().expect(404, done)
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().update(cluster.id).expect(401, done);
    });
  });
});
