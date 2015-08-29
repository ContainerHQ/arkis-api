'use strict';

let RegionSizeManager = require('../../../app/services').RegionSizeManager;

describe('GET /nodesizes', () => {
  db.sync();

  let user, manager;

  beforeEach(() => {
    user    = factory.buildSync('user');
    manager = new RegionSizeManager();
    return user.save();
  });

  it('returns the list of sizes', done => {
    api.nodeSizes(user).getAll().expect(200, (err, res) => {
      if (err) { return done(err); }

      let sizes = res.body.sizes;

      manager.getSizes().then(expected => {
        expect(sizes).to.deep.equal(expected);
        done();
      }).catch(done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.nodeSizes().getAll().expect(401, done);
    });
  })
});
