'use strict';

let _ = require('lodash'),
  Cluster = require('../../../../app/models').Cluster;

describe('POST /clusters/', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('creates a cluster for the user', done => {
    let form = factory.buildSync('cluster').dataValues,
      params = _.omit(form, [
        'id', 'token', 'cert', 'docker_version', 'swarm_version'
      ]);

    api.clusters(user).create().send(form)
    .expect(201, has.one(user, 'cluster', { with: params }, done));
  });

  context('with invalid attributes', () => {
    it('returns a bad request status and validation errors', done => {
      api.clusters(user).create().send()
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(Cluster.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let cluster, form, attributes;

    beforeEach(() => {
      cluster = factory.buildSync('forbiddenCluster');
      attributes = _.difference(cluster.attributes,
        ['name', 'strategy', 'token', 'docker_version', 'swarm_version']
      );
      form = cluster.dataValues;
    });

    it('these attributes are filtered', done => {
      api.clusters(user).create().send(form)
      .expect(201, (err, res) => {
        if (err) { return done(err); }

        expect(user.getClusters({ where: { name: cluster.name } })
        .then(clusters => {
          return _.first(clusters);
        })).to.eventually.satisfy(has.beenFiltered(cluster, attributes))
           .notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().create().expect(401, done);
    });
  });
});
