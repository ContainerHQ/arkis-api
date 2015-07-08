'use strict';

let moment = require('moment');

const DEFAULT_STATE = 'empty',
      VALID_STATES = [DEFAULT_STATE, 'deploying', 'upgrading', 'running'];

module.exports = function(modelName) {
  describe('behaves as a state machine:', () => {
    it('fails with an empty last state', () => {
      let model = factory.buildSync(modelName, { last_state: null });

      return expect(model.save()).to.be.rejected;
    });

    it('fails with an invalid last state', () => {
      let model = factory.buildSync(modelName, { last_state: 'whatever' });

      return expect(model.save()).to.be.rejected;
    });

    VALID_STATES.forEach(state => {
      it(`succeeds with a last state equal to ${state}`, () => {
        let model = factory.buildSync(modelName, { last_state: state });

        return expect(model.save()).to.be.fulfilled;
      });

      context(`when last state is equal to ${state}`, () => {
        context('when last ping is recent', () => {
          let model;

          beforeEach(() => {
            model = factory.buildSync(modelName, {
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
            model = factory.buildSync(modelName, {
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

    it(`is by default in ${DEFAULT_STATE} state`, () => {
      let model = factory.buildSync(modelName);

      return expect(model.save())
        .to.eventually.have.property('state', DEFAULT_STATE);
    });
  });
}
