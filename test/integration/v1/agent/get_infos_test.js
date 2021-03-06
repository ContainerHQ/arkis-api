'use strict';

let AgentManager = require('../../../../app/services').AgentManager;

describe('GET /agent/:token/infos', () => {
  db.sync();
  db.create(['cluster', 'node']);

  let manager, node;

  beforeEach(() => {
    let cluster = factory.buildSync('cluster');

    return cluster.save().then(() => {
      node = factory.buildSync('node', { cluster_id: cluster.id });
      return node.save();
    }).then(() => {
      manager = new AgentManager(node);
    });
  });

  it('returns the infos required by the node agent', done => {
    api.agent(node).infos()
    .expect(200, (err, res) => {
      if (err) { return done(err); }

      manager.infos().then(infos => {
        expect(res.body).to.deep.equal(infos);
        done();
      }).catch(done);
    });
  });

  context('when node no longer exists', () => {
    beforeEach(() => {
      return node.destroy();
    });

    it('returns a 404 not found', done => {
      api.agent(node).infos().expect(404, done);
    });
  });

  context('when token is invalid', () => {
    it('returns a 401 unauthorized', done => {
      api.agent().infos().expect(401, done);
    });
  });
});
