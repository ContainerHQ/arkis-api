'use strict';

let Cluster = require('../../../app/models').Cluster;

describe('POST /clusters/', () => {
  db.sync();

  let user;

  beforeEach(() => {
    user = factory.buildSync('user');
    return user.save();
  });

  it('creates a cluster for the user', done => {
    let form = factory.buildSync('cluster').dataValues;

    api.clusters(user).create().send(form)
    .expect(201)
    .end((err, res) => {
      if (err) { return done(err); }

      let cluster = format.timestamps(res.body.cluster);

      expect(
        user.getClusters({ where: { id: cluster.id } })
        .then(clusters => {
          return _.first(clusters).toJSON();
        })
      ).to.eventually.deep.equal(cluster)
       .and.include(
         _.merge(_.omit(form, ['id', 'token']), { user_id: user.id }))
       .and.have.property('token').that.exist
       .notify(done);
    });
  });

  context('with invalid attributes', () => {
    it('returns a bad request status and validation errors', done => {
      api.clusters(user).create().send()
      .expect(400)
      .end((err, res) => {
        if (err) { return done(err); }

        expect(Cluster.create())
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let attributes, form;

    beforeEach(() => {
      let cluster = factory.buildSync('forbiddenCluster');

      form = cluster.dataValues;
      attributes = _.difference(cluster.attributes,
        ['id', 'name', 'strategy', 'created_at', 'updated_at']
      );
    });

    it('these attributes are filtered', done => {
      api.clusters(user).create().send(form)
      .expect(201)
      .end((err, res) => {
        if (err) { return done(err); }

        let expected = _.merge({ user_id: user.id },
          _.omit(form, attributes, 'id')
        );
        expect(
          user.getClusters({ where: { id: res.body.cluster.id } })
          .then(clusters => {
            return _.first(clusters).toJSON();
          })
        ).to.eventually.include(expected).notify(done);
      });
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.clusters().create().expect(401, {}, done);
    });
  });
});
