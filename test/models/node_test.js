'use strict';

let concerns = require('./concerns');

describe('Node Model', () => {
  db.sync();

  concerns.behavesAsAStateMachine('node');

  describe('validations', () => {
    it('succeeds with valid attributes', () => {
      let node = factory.buildSync('node');

      return expect(node.save()).to.be.fulfilled;
    });
  });
});
