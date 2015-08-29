'use strict';

var _ = require('lodash'),
  config = require('../../config'),
  RegionSizeManager = require('../../app/services').RegionSizeManager;


describe('RegionSizeManager Service', () => {
  let manager;

  beforeEach(() => {
    manager = new RegionSizeManager();
  });

  describe('constructor', () => {
    it('initializes machine with config credentials', () => {
      expect(manager.machine.credentials).to.equal(config.auth.machine);
    });
  });

  describe('#getRegions', () => {
    let expected;

    beforeEach(() => {
      return manager.machine.getRegions(regions => {
        expected = regions;
      });
    });

    it('returns the machine regions', () => {
      return expect(manager.getRegions())
        .to.eventually.not.be.empty.and.deep.equal(expected);
    });
  });

  describe('#getSizes', () => {
    let expected;

    beforeEach(() => {
      return manager.machine.getRegions(sizes => {
        expected = sizes;
      });
    });

    it('returns the machine sizes', () => {
      return expect(manager.getSizes())
        .to.eventually.not.be.empty.and.deep.equal(expected);
    });
  });
});
