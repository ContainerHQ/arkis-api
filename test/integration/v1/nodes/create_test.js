'use strict';

let _ = require('lodash'),
  services = require('../../../../app/services'),
  Node = require('../../../../app/models').Node;

describe('POST /clusters/:cluster_id/nodes', () => {
  db.sync();

  let user, cluster;

  beforeEach(() => {
    user = factory.buildSync('user');
    return new services.AccountManager(user).register().then(() => {
      cluster = factory.buildSync('cluster', { user_id: user.id });
      return cluster.save();
    });
  });

  [
    ['byon slave', { name: 'create', master: false, byon: true, labels: {
      environment: 'production', storage: 'hdd'
    }}],
    ['arkis master', { name: 'create', master: true, region: 'europe',
      size: 'small'
    }]
  ].forEach(([title, form]) => {
    context(`with a ${title} node`, () => {
      it(`creates a ${title} node for the cluster`, done => {
        api.clusters(user).nodes(cluster).create().send(form)
        .expect(202, has.one(cluster, 'node', { with: form }, done));
      });

      it('creates a deploy action for the node', done => {
        api.clusters(user).nodes(cluster).create().send(form)
        .expect(202, (err, res) => {
          if (err) { return done(err); }

          expect(res.body.action).to.include({
            type: 'deploy',
            resource: 'node',
            resource_id: res.body.node.id
          });
          done();
        });
      });
    });
  });

  ['region', 'size'].forEach(machineOption => {
    context(`with unavailable ${machineOption}`, () => {
      let form = { name: machineOption, byon: false };

      form[machineOption] = null;

      api.clusters(user).nodes(cluster).create().send(form).expect(422);
    });
  });

  context('with invalid attributes', () => {
    it('returns a bad request status and validation errors', done => {
      api.clusters(user).nodes(cluster).create().send()
      .expect(400, (err, res) => {
        if (err) { return done(err); }

        Node.create().then(done).catch(err => {
          expect(res.body).to.deep.equal(format.error(err));
        }).then(done).catch(done);
      });
    });
  });

  context('with blacklisted attributes', () => {
    let node, form, attributes;

    beforeEach(() => {
      node = factory.buildSync('forbiddenNode');
      form = node.dataValues;
      attributes = _.difference(node.attributes, [
        'id', 'cluster_id', 'encrypted_token', 'fqdn',
        'name', 'master', 'labels', 'byon', 'region', 'size',
      ]);
    });

    it('these attributes are filtered', done => {
      api.clusters(user).nodes(cluster).create().send(form)
      .expect(202, (err, res) => {
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
      api.clusters().nodes(cluster).create().expect(401, done);
    });
  });
});
