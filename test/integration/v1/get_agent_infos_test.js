'use strict';

describe('GET /agent/:token/infos', () => {
  db.sync();

  context('when the node exists', () => {
    let node;

    beforeEach(() => {
      return factory.buildSync('cluster').save().then(cluster => {
        node = factory.buildSync('node', { cluster_id: cluster.id });
        return node.save();
      });
    });

    it('returns the infos required by the node agent', done => {
      api.agent(node.token).infos()
      .expect(200, (err, res) => {
        if (err) { return done(err); }

        node.agentInfos().then(infos => {
          expect(res.body).to.deep.equal(infos);
          done();
        }).catch(done);
      });
    });
  });

  context("when the node doesn't exist", () => {
    it('returns a 404 not found', done => {
      api.agent().infos().expect(404, {}, done);
    });
  });
});
