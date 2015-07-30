'use strict';

let moment = require('moment');

describe('PATCH /agent/:token/live', () => {
  db.sync();

  context('when the node exists', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node', { last_ping: null });
      return node.save();
    });

    it('updates the node last_ping attribute', done => {
      api.agent(node.token).live()
      .expect(204, (err, res) => {
        if (err) { return done(err); }

        node.reload().then(() => {
          expect(moment(node.last_ping).fromNow())
            .to.equal('a few seconds ago');
          done();
        }).catch(done);
      });
    });
  });

  context("when the node doesn't exist", () => {
    it('returns a not found error', done => {
      api.agent().live()
      .expect(404, {}, done);
    });
  });
});
