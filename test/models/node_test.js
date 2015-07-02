'use strict';

let _ = require('lodash'),
  concerns = require('./concerns');

describe('Node Model', () => {
  db.sync();

  concerns.behavesAsAStateMachine('node');

  describe('validations', () => {
    /*
     * For this test we need to use a node with most of
     * the existing fields. Therefore, we are using a
     * registered node with a proper fqdn and public_ip.
     */
    it('succeeds with valid attributes', done => {
      factory.create('registeredNode', done);
    });

    it('fails without a name', () => {
      let node = factory.buildSync('node', { name: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an empty name', () => {
      let node = factory.buildSync('node', { name: '' });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a too long name', () => {
      let node = factory.buildSync('node', { name: _.repeat('*', 65) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid fqdn', () => {
      let node = factory.buildSync('node', { fqdn: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an invalid public_ip', () => {
      let node = factory.buildSync('node', { public_ip: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });
  });

  it('it is not a master node by default', () => {
    let node = factory.buildSync('node');

    return expect(node.save()).to.eventually.have.property('master', false);
  });
});
