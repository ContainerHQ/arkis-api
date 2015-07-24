'use strict';

let _ = require('lodash'),
  moment = require('moment');

module.exports = function(factoryName, opts={}) {
  let defaultState = opts.default || 'empty',
    validStates = ['empty', 'deploying', 'upgrading', 'running'];

  if (defaultState !== 'empty') {
    validStates = _.remove(validStates, 'empty');
  }

  describe('behaves as a state machine:', () => {
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
        context('when last ping is recent', () => {
          let model;

          beforeEach(() => {
            model = factory.buildSync(factoryName, {
              last_state: state,
              last_ping: moment()
            });
            return model.save();
          });

          it(`has a state equals to ${state}`, () => {
            expect(model.state).to.equal(state);
          });
        });

        context('when last ping has expired', () => {
          let model;

           beforeEach(() => {
            model = factory.buildSync(factoryName, {
              last_state: state,
              last_ping: moment().subtract(6, 'minutes')
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

    it(`is by default in ${defaultState} state`, () => {
      let model = factory.buildSync(factoryName);

      return expect(model.save())
        .to.eventually.have.property('state', defaultState);
    });
  });
}
