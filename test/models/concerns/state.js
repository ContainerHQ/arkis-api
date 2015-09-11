'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  models = require('../../../app/models');

module.exports = function(factoryName) {
  return function(opts={}) {
    let defaultState = opts.default || 'empty',
      validStates = ['empty', 'deploying', 'upgrading', 'updating', 'running'];

    if (defaultState !== 'empty') {
      validStates = _.pull(validStates, 'empty');
    }
    let modelName = factory.buildSync(factoryName).__options.name.singular;

    describe('behaves as a state machine:', () => {
      describe('validations', () => {
        it('fails with an empty last state', () => {
          let model = factory.buildSync(factoryName, { last_state: null });

          return expect(model.save()).to.be.rejected;
        });

        it('fails with an invalid last state', () => {
          let model = factory.buildSync(factoryName, { last_state: 'whatever' });

          return expect(model.save()).to.be.rejected;
        });

        validStates.forEach(state => {
          it(`succeeds with a last state equal to ${state}`, () => {
            let model = factory.buildSync(factoryName, { last_state: state });

            return expect(model.save()).to.be.fulfilled;
          });

          context(`when last state is equal to ${state}`, () => {
            context('when last seen is recent', () => {
              let model;

              beforeEach(() => {
                model = factory.buildSync(factoryName, {
                  last_state: state,
                  last_seen: moment()
                });
                return model.save();
              });

              it(`has a state equals to ${state}`, () => {
                expect(model.state).to.equal(state);
              });
            });

            context('when last seen is null' ,() => {
              let model;

               beforeEach(() => {
                model = factory.buildSync(factoryName, {
                  last_state: state,
                  last_seen: null
                });
                return model.save();
              });

              if (state === 'running') {
                it('is unreachable', () => {
                  expect(model.state).to.equal('unreachable');
                });
              } else {
                it(`has a state equals to ${state}`, () => {
                  expect(model.state).to.equal(state);
                });
              }
            });

            context('when last seen has expired', () => {
              let model;

               beforeEach(() => {
                model = factory.buildSync(factoryName, {
                  last_state: state,
                  last_seen: moment().subtract(6, 'minutes')
                });
                return model.save();
              });

              if (state === 'running') {
                it('is unreachable', () => {
                  expect(model.state).to.equal('unreachable');
                });
              } else {
                it(`has a state equals to ${state}`, () => {
                  expect(model.state).to.equal(state);
                });
              }
            });
          });
        });
      });

      describe('scopes', () => {
        describe('state', () => {
          const STATES = ['unreachable'].concat(validStates);

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

      it(`is by default in ${defaultState} state`, () => {
        let model = factory.buildSync(factoryName);

        return expect(model.save())
          .to.eventually.have.property('state', defaultState);
      });
    });
  };
};
