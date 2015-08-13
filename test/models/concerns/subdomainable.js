'use strict';

let _ = require('lodash');

module.exports = function(factoryName) {
  return function(attributeName) {
    describe(`has a subdomainable ${attributeName}`, () => {
      it('succeeds when at min size', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = _.repeat('a', 1);

        return expect(model.save()).to.be.fulfilled;
      });

      it('succeeds when at max size', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = _.repeat('b', 64);

        return expect(model.save()).to.be.fulfilled;
      });

      it('succeeds when including a hyphen', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = 'test-prod';

        return expect(model.save()).to.be.fulfilled;
      });

      it('fails when starting with a hyphen', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = '-test';

        return expect(model.save()).to.be.rejected;
      });

      it('fails when ending with a hyphen', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = 'test-';

        return expect(model.save()).to.be.rejected;
      });

      ['/', '\\', '"', "'", '*'].forEach(value => {
        it(`failed when including a ${value}`, () => {
          let model = factory.buildSync(factoryName);

          model[attributeName] = `te${value}st`;

          return expect(model.save()).to.be.rejected;
        });
      });

      it('fails when null', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = null;

        return expect(model.save()).to.be.rejected;
      });

      it('fails when empty', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = '';

        return expect(model.save()).to.be.rejected;
      });

      it('fails when a too long', () => {
        let model = factory.buildSync(factoryName);

        model[attributeName] = _.repeat('a', 65);

        return expect(model.save()).to.be.rejected;
      });
    });
  };
};
