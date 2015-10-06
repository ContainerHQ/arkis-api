'use strict';

let services = require('../../app/services');

describe('ProviderManager Service', () => {
  let manager;

  beforeEach(() => {
    return factory.buildSync('user').save.then(user => {
      manager = new services.ProviderManager()
    });
  });

  describe('#link', () => {
    it('registers the user ssh key', () => {

    });
  });

  describe('#unlink', ()=> {
    it('unregisters the user ssh key', () => {

    });
  });
});
