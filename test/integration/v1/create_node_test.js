'use strict';

let _ = require('lodash'),
  Node = require('../../../app/models').Node;

describe('POST /clusters/:cluster_id/nodes', () => {
  db.sync();

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  context('with a byon slave node', () => {
    let form = { name: 'create', master: false, byon: true };

    it('creates a byon slave node for the cluster', done => {
      api.clusters(user).nodes(cluster).create().send(form)
      .expect(201, has.one(cluster, 'node', { with: form }, done));
    });
  });

  context('with a arkis master node', () => {
    let form = { name: 'create', master: true, region: 'europe',
      node_size: 'small'
    };

    it('creates a arkis master node for the cluster', done => {
      api.clusters(user).nodes(cluster).create().send(form)
      .expect(201, has.one(cluster, 'node', { with: form }, done));
    });
  });


  context('with invalid attributes', () => {
    it('returns a bad request status and validation errors', done => {
      api.clusters(user).nodes(cluster).create().send()
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(Node.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let node, form, attributes;

    beforeEach(() => {
      node = factory.buildSync('forbiddenNode');
      form = node.dataValues;
      attributes = _.difference(node.attributes,
        ['name', 'master', 'byon', 'region', 'node_size', 'token', 'fqdn']
      );
    });

    it('these attributes are filtered', done => {
      api.clusters(user).nodes(cluster).create().send(form)
      .expect(201, (err, res) => {
        if (err) { return done(err); }

        expect(cluster.getNodes({ where: { name: node.name } })
        .then(nodes => {
          return _.first(nodes);
        })).to.eventually.satisfy(has.beenFiltered(node, attributes))
           .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().nodes(cluster).create().expect(401, {}, done);
    });
  });
});
