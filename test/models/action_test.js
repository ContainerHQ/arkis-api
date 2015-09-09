'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  concerns = require('./concerns'),
  Action = require('../../app/models').Action;

const DEFAULT_STATE = 'in-progress';

describe('Action Model', () => {
  db.sync();

  concerns('action').serializable({
    omit: ['created_at', 'updated_at', 'last_state'] }
  );

  describe('validations', () => {
    it('succeeds with valid attributes', done => {
      factory.create('action', done);
    });

    ['deploy', 'update', 'upgrade'].forEach(type => {
      it(`succeeds with type ${type}`, done => {
        factory.create('action', { type: type }, done);
      });
    });

    ['node', 'cluster'].forEach(resource => {
      it(`succeeds with resource ${resource}`, done => {
        factory.create('action', { resource: resource }, done);
      });
    });

    ['in-progress', 'completed'].forEach(lastState => {
      it(`succeeds with last_state ${lastState}`, done => {
        factory.create('action', { last_state: lastState }, done);
      });
    });

    ['last_state', 'type', 'resource'].forEach(attribute => {
      let opts;

      beforeEach(() => {
        opts = {};
      });

      it(`fails with null ${attribute}`, () => {
        opts[attribute] = null;

        return expect(factory.buildSync('action', opts).save()).to.be.rejected;
      });

      it(`fails with empty ${attribute}`, () => {
        opts[attribute] = '';

        return expect(factory.buildSync('action', opts).save()).to.be.rejected;
      });

      it(`fails with invalid ${attribute}`, () => {
        opts[attribute] = random.string();

        return expect(factory.buildSync('action', opts).save()).to.be.rejected;
      });
    });

    it('fails with null resource_id', () => {
      let opts = { resource_id: null };

      return expect(factory.buildSync('action', opts).save()).to.be.rejected;
    });
  });

  describe('scopes', () => {
    describe('state', () => {
      const STATES = ['in-progress', 'completed', 'errored'];

      STATES.forEach(state => {
        beforeEach(done => {
          factory.createMany(`${state}Action`, 5, done);
        });
      });

      STATES.forEach(state => {
        context(`with state ${state}`, () => {
          const SCOPE = { method: ['state', state] };

          it(`returns all the actions with state ${state}`, () => {
            return Action.scope(SCOPE).findAll().then(actions => {
              return expect(_.all(actions, action => {
                return action.state === state;
              })).to.be.true;
            });
          });
        });
      });
    });
  });

  describe('state', () => {
    context("when started_at hasn't expired", () => {
      let action;

      beforeEach(() => {
        action = factory.buildSync('action');
        return action.save();
      });

      ['in-progress', 'completed'].forEach(lastState => {
        context(`when last_state is ${lastState}`, () => {
          beforeEach(() => {
            return action.update({ last_state: lastState });
          });

          it(`is in state ${lastState}`, () => {
            expect(action.state).to.equal(lastState);
          });
        });
      });
    });

    context('when started_at expired', () => {
      let clock, action;

      beforeEach(() => {
        clock = sinon.useFakeTimers();

        action = factory.buildSync('action');
        return action.save().then(() => {
          clock.tick(600000);
        });
      });

      afterEach(() => {
        clock.restore();
      });

      context('when last_state is in-progress', () => {
        beforeEach(() => {
          return action.update({ last_state: 'in-progress' });
        });

        it('is in errored state', () => {
          expect(action.state).to.equal('errored');
        });
      });

      context('when last_state is completed', () => {
        beforeEach(() => {
          return action.update({ last_state: 'completed' });
        });

        it('is in completed state', () => {
          expect(action.state).to.equal('completed');
        });
      });
    });
  });

  describe('#create', () => {
    let action;

    beforeEach(() => {
      action = factory.buildSync('action');
      return action.save();
    });

    it(`initializes last_state to ${DEFAULT_STATE}`, () => {
      expect(action.last_state).to.equal(DEFAULT_STATE);
    });

    it('initializes completed_at to null', () => {
      expect(action.completed_at).to.be.null;
    });

    it('initializes started_at to current datetime', () => {
      expect(moment(action.started_at).fromNow())
        .to.equal('a few seconds ago');
    });
  });

  describe('#complete', () => {
    let clock, action;

    beforeEach(() => {
      clock = sinon.useFakeTimers();

      action = factory.buildSync('action');
      return action.save().then(() => {
        clock.tick(2000);
        return action.complete();
      }).then(() => {
        return action.reload();
      });
    });

    afterEach(() => {
      clock.restore();
    });

    it('has completed_at equal to current datetime', () => {
      expect(action.completed_at).to.deep.equal(moment().toDate());
    });

    it('is in completed state', () => {
      expect(action.state).to.equal('completed');
    });
  });
});
