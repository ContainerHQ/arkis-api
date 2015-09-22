'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  AgentManager = require('../../../../app/services').AgentManager;

describe('GET /agent/clusters/:token', () => {
  db.sync();
  db.create(['cluster', 'node']);

  let cluster, node, manager;

  beforeEach(() => {
    cluster = factory.buildSync('cluster');
    node    = factory.buildSync('runningNode');

    return cluster.save().then(() => {
      return cluster.addNode(node);
    }).then(() => {
      manager = new AgentManager(node);
    });
  });

  context('when node is master', () => {
    beforeEach(() => {
      return node.update({ master: true });
    });

    it('returns running nodes addresses of its cluster', done => {
      api.agent(node).fetch().expect(200, (err, res) => {
        if (err) { return done(err); }

        manager.fetch().then(addresses => {
          expect(res.body).to.deep.equal(addresses);
          done();
        }).catch(done);
      });
    });

    it('updates the cluster last_seen', done => {
      api.agent(node).fetch().expect(200, (err, res) => {
        if (err) { return done(err); }

        cluster.reload().then(() => {
          expect(moment(cluster.last_seen).fromNow())
            .to.equal('a few seconds ago');
          done();
        }).catch(done);
      });
    });
  });

  context('when node is slave', () => {
    beforeEach(() => {
      return node.update({ master: false });
    });

    it('returns a forbidden error', done => {
      api.agent(node).fetch().expect(403, done);
    });
  });

  context('when node no longer exists', () => {
    beforeEach(() => {
      return node.destroy();
    });

    it('returns a 404 not found', done => {
      api.agent(node).fetch().expect(404, done);
    });
  });

  context('when token is invalid', () => {
    it('returns a 401 unauthorized', done => {
      api.agent().fetch().expect(401, done);
    });
  })
});
