'use strict';

let RegionSizeManager = require('../../../../app/services').RegionSizeManager;

describe('GET /regions', () => {
  db.sync();

  let user, manager;

  beforeEach(() => {
    user    = factory.buildSync('user');
    manager = new RegionSizeManager();
    return user.save();
  });

  it('returns the list of regions', done => {
    api.regions(user).getAll().expect(200, (err, res) => {
      if (err) { return done(err); }

      let regions = res.body.regions;

      manager.getRegions().then(expectedRegions => {
        expect(regions).to.deep.equal(expectedRegions);
        done();
      }).catch(done);
    });
  });

  context('when API token is incorrect', () => {
    it('returns an unauthorized status', done => {
      api.regions().getAll().expect(401, done);
    });
  })
});
