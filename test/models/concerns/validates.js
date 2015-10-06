'use strict';

let _ = require('lodash');

let validates = {};

class Validator {
  constructor(factoryName, attribute, expectations={}) {
    this.factoryName  = factoryName;
    this.attribute    = attribute;
    this.expectations = expectations;
  }
  buildModelWith(value) {
    beforeEach(() => {
      this._model = factory.buildSync(this.factoryName);

      if (!!this.attribute) {
        this._model[this.attribute] = value;
      }
    });
  }
  expectFailure() {
    it('validations failed', () => {
      return expect(this._model.validate()).to.eventually.exist;
    });

    it("can't save the entity in database", () => {
      return expect(this._model.save()).to.be.rejected;
    });
  }
  expectSuccess() {
    it('validations succeeds', () => {
      return expect(this._model.validate()).to.eventually.not.exist;
    });

    it('saves the entity in database', () => {
      return expect(this._model.save()).to.be.fulfilled;
    });

    if (this.expectations.multiple) {
      it(`can create multiple ${this.factoryName}`, () => {
        return expect(this._model.save()).to.be.fulfilled;
      });
    }
  }
  presence() {
    [null, undefined].forEach(value => {
      context(
        `when ${this.factoryName} has ${this.attribute} equal to '${value}'`
      , () => {
        this.buildModelWith(value);
        this.expectFailure();
      });
    });
  }
  length({ min, max, convert }) {
    [min, max].forEach(length => {
      context(
        `when ${this.factoryName} has a ${this.attribute} with a length of ${length}`
      , () => {
        this.buildModelWith(convert ?  _.repeat('a', length) : length);
        this.expectSuccess();
      });
    });

    [min - 1, max + 1].forEach(length => {
      if (length > 0) {
        context(
          `when ${this.factoryName} has a ${this.attribute} with a length of ${length}`
        , () => {
          this.buildModelWith(convert ?  _.repeat('a', length) : length);
          this.expectFailure();
        });
      }
    });
  }
  uniqueness({ scope, type, value }) {
    if (!value) { value = random[type](); }

    let opts = {};

    opts[this.attribute] = value;

    if (!!scope) {
      beforeEach(() => {
        return factory.buildSync(scope).save().then(modelScope => {
          opts[`${scope}_id`] = modelScope.id;
          return factory.buildSync(this.factoryName, opts).save();
        });
      });

      context(
        `when ${this.factoryName} already exist with the same ${this.attribute} and the same ${scope}`
      , () => {
        beforeEach(() => {
          this._model = factory.buildSync(this.factoryName, opts);
        });

        this.expectFailure();
      });

      context(
        `when ${this.factoryName} already exist with the same ${this.attribute} but for a different ${scope}`
      , () => {
        beforeEach(() => {
          opts[`${scope}_id`] = null;
          this._model = factory.buildSync(this.factoryName, opts);
        });

        this.expectSuccess();
      });
    } else {
      context(
        `when ${this.factoryName} already exists with the same ${this.attribute}`
      , () => {
        beforeEach(done => {
          factory.create(this.factoryName, opts, done);
        });

        this.buildModelWith(value);
        this.expectFailure();
      });
    }
  }
  inclusion(values) {
    values.forEach(value => {
      context(
        `when ${this.factoryName} has ${this.attribute} equal to '${value}'`
      , () => {
        this.buildModelWith(value);
        this.expectSuccess();
      });
    });

    context(
      `when ${this.factoryName} has another ${this.attribute} value`
    , () => {
      this.buildModelWith(random.string());
      this.expectFailure();
    });
  }
  exclusion(values) {
    values.forEach(value => {
      context(
        `when ${this.factoryName} ${this.attribute} is equal to '${value}'`
      , () => {
        this.buildModelWith(value);
        this.expectFailure();
      });
    });
  }
  subdomainable(){
    this.presence();
    this.length({ min: 1, max: 32, convert: true });

    context(
      `when ${this.factoryName} ${this.attribute} includes a hypen`
    , () => {
      this.buildModelWith('test-prod');
      this.expectSuccess();
    });

    context(
      `when ${this.factoryName} ${this.attribute} starts with a hypen`
    , () => {
      this.buildModelWith('-test');
      this.expectFailure();
    });

    context(
      `when ${this.factoryName} ${this.attribute} ends with a hypen`
    , () => {
      this.buildModelWith('test-');
      this.expectFailure();
    });

    ['/', '\\', '"', "'", '*'].forEach(value => {
      context(
        `when ${this.factoryName} ${this.attribute} includes a ${value}`
      , () => {
        this.buildModelWith(`te${value}st`);
        this.expectFailure();
      });
    });
  }
  is(type) {
    context(
      `when ${this.factoryName} ${this.attribute} is an ${type}`
    , () => {
      this.buildModelWith(random[type]())
      this.expectSuccess();
    });

    context(
      `when ${this.factoryName} ${this.attribute} is not an ${type}`
    , () => {
      this.buildModelWith(random.string())
      this.expectFailure();
    });
  }
  incompatible(attributes) {
    context(`when ${this.factoryName} is ${this.attribute}`, () => {
      this.buildModelWith(true);

      attributes.forEach(attribute => {
        context(`when ${this.factoryName} has a ${attribute}`, () => {
          beforeEach(() => {
            this._model[attribute] = random.string();
          });
          this.expectFailure();
        });
      });

      context(`when ${this.factoryName} has no ${attributes}`, () => {
        beforeEach(() => {
          attributes.forEach(attribute => {
            this._model[attribute] = null;
          });
        });
        this.expectSuccess();
      });
    });
  }
}

module.exports = function(factoryName) {
  return function(attributes) {
    context(`with ${factoryName}`, () => {
      let validator = new Validator(factoryName, null, { multiple: true });

      validator.buildModelWith();
      validator.expectSuccess();

      _.mapKeys(attributes, (validations, attribute) => {
        _.mapKeys(validations, (opts, validation) => {
          validator = new Validator(factoryName, attribute);

          validator[validation](opts);
        });
      });
    });
  };
};
