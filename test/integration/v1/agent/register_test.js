'use strict';

let moment = require('moment');

describe('POST /agent/clusters/:token/', () => {
  db.sync();
  db.create(['cluster', 'node']);

  let node;

  beforeEach(() => {
    node = factory.buildSync('node');
    return node.save();
  });

  context('when address is valid', () => {
    let ip, addr;

    beforeEach(() => {
      ip   = random.ip();
      addr = `${ip}:2375`;
    });

    it('updates the node public_ip and last_seen', done => {
      api.agent(node).register(addr).expect(204, (err, res) => {
        if (err) { return done(err); }

        node.reload().then(() => {
          expect(moment(node.last_seen).fromNow())
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

        node.update({ public_ip: '' }).then(done).catch(err => {
          expect(res.body).to.deep.equal(format.error(err));
        }).then(done).catch(done);
      });
    });
  });

  context('when node no longer exists', () => {
    beforeEach(() => {
      return node.destroy();
    });

    it('returns a not found error', done => {
      api.agent(node).register().expect(404, done);
    })
  });

  context('when token is invalid', () => {
    it('returns a 401 unauthorized', done => {
      api.agent().register().expect(401, done);
    });
  });
});
