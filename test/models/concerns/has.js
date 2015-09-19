'use strict';

let _ = require('lodash');

let has = {};

has.default = function(factoryName, attributes) {
  _.mapKeys(attributes, (value, attribute) => {
    it(`has default ${attribute} equal to ${value}`, () => {
      let model = factory.buildSync(factoryName);

      return expect(model.save())
        .to.eventually.have.property(attribute)
        .that.deep.equals(value);
    });
  });
};

has.counterCache = function(factoryName, children) {
  children.forEach(child => {

    context(`when ${factoryName} exists`, () => {
      let model;

      beforeEach(() => {
        model = factory.buildSync(factoryName);
        return model.save();
      });

      context(`adding a ${child} to this ${factoryName}`, () => {
        beforeEach(() => {
          return model[`add${_.capitalize(child)}`](
            factory.buildSync(child)
          );
        });

        it(`increases ${factoryName} counter cache`, () => {
          expect(model.reload())
            .to.eventually.have.property(`${child}s_count`, 1);
        });
      });
    });
  });
};

module.exports = function(factoryName) {
  return function(specificities) {
    _.mapKeys(specificities, (opts, specificity) => {
      has[specificity](factoryName, opts);
    });
  };
};
