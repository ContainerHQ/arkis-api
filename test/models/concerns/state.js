'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  models = require('../../../app/models');

module.exports = function(factoryName) {
  return function({ attribute, expiration }) {
    let modelName = factory.buildSync(factoryName).__options.name.singular;

    describe('behaves as a state machine:', () => {
      let has = require('./has')(factoryName),
        validates = require('./validates')(factoryName);

      has({
        default: {
          state: attribute.default
        }
      });

      validates({
        last_state: {
          presence: true,
          inclusion: attribute.values
        }
      });

      let { constraint, when, mustBe, after, ignoreNull } = expiration;

      attribute.values.forEach(state => {
        context(`when ${attribute.name} is equal to ${state}`, () => {
          context(`when ${constraint.name} is recent`, () => {
            let model;

            beforeEach(() => {
              model = factory.buildSync(factoryName)

              model[attribute.name] = state;
              model[constraint.name] = moment();
              return model.save();
            });

            it(`has a state equals to ${state}`, () => {
              expect(model.state).to.equal(state);
            });
          });

          if (!ignoreNull) {
            context(`when ${constraint.name} is null` ,() => {
              let model;

               beforeEach(() => {
                model = factory.buildSync(factoryName)

                model[attribute.name] = state;
                model[constraint.name] = null;
                return model.save();
              });

              if (state === when) {
                it(`is ${mustBe}`, () => {
                  expect(model.state).to.equal(mustBe);
                });
              } else {
                it(`has a state equals to ${state}`, () => {
                  expect(model.state).to.equal(state);
                });
              }
            });
          }

          context(`when ${constraint.name} has expired`, () => {
            let model;

            beforeEach(() => {
              model = factory.buildSync(factoryName)

              model[attribute.name] = state;
              model[constraint.name] = moment().subtract(after.amount + 1, after.key);

              return model.save();
            });

            if (state === when) {
              it(`is ${mustBe}`, () => {
                expect(model.state).to.equal(mustBe);
              });
            } else {
              it(`has a state equals to ${state}`, () => {
                expect(model.state).to.equal(state);
              });
            }
          });
        });
      });

      describe('scopes', () => {
        describe('state', () => {
          const STATES = [mustBe].concat(attribute.values);

          STATES.forEach(state => {
            beforeEach(done => {
              factory.createMany(`${state}${modelName}`, 5, done);
            });
          });

          STATES.forEach(state => {
            context(`with state ${state}`, () => {
              const SCOPE = { method: ['state', state] };

              it(`returns all with state ${state}`, () => {
                return models[modelName]
                .scope(SCOPE).findAll().then(results => {
                  return expect(_.all(results, result => {
                    return result.state === state;
                  })).to.be.true;
                });
              });
            });
          });
        });
      });
    });
  };
};
