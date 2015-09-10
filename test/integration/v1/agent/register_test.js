'use strict';

let moment = require('moment');

describe('POST /agent/clusters/:token/', () => {
  db.sync();

  let node, ip, addr;

  beforeEach(() => {
    node = factory.buildSync('node', { last_ping: null });
    ip = random.ip();
    addr = `${ip}:2375`;
    return node.save();
  });

  context('when address is valid', () => {
    it('updates the node public_ip and last_ping', done => {
      api.agent(node).register(addr).expect(204, (err, res) => {
        if (err) { return done(err); }

        node.reload().then(() => {
          expect(moment(node.last_ping).fromNow())
            .to.equal('a few seconds ago');
          expect(node.public_ip).to.equal(ip);
          done();
        }).catch(done);
      });
    });
  });

  context('when address is invalid', () => {
    it('returns a bad request with validations error', done => {
      api.agent(node).register('').expect(400, (err, res) => {
        if (err) { return done(err); }

        expect(node.update({ public_ip: '' }))
          .to.be.rejectedWith(res.body.errors)
          .notify(done);
      });
    });
  });

  context('when node no longer exists', () => {
    beforeEach(() => {
      return node.destroy();
    });

    it('returns a not found error', done => {
      api.agent(node).register(addr).expect(404, done);
    })
  });

  context('when token is invalid', () => {
    it('returns a 401 unauthorized', done => {
      api.agent().register(addr).expect(401, done);
    });
  });
});
