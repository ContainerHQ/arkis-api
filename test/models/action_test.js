'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  concerns = require('./concerns'),
  config = require('../../config'),
  Action = require('../../app/models').Action;

const DEFAULT_STATE = 'in-progress';

describe('Action Model', () => {
  db.sync();

  concerns('action').behavesAsAStateMachine({
    attribute: {
      name: 'last_state',
      default: 'in-progress',
      values: ['in-progress', 'completed']
    },
    expiration: {
      when: 'in-progress',
      mustBe: 'errored',
      constraint: {
        name: 'started_at',
        default: 'NOW'
      },
      after: config.agent.heartbeat,
      ignoreNull: true
    }
  });

  concerns('action').serializable({
    omit: ['created_at', 'updated_at', 'last_state'] }
  );

  concerns('action').validates({
    type: {
      inclusion: ['deploy', 'update', 'upgrade'],
      presence: true
    },
    last_state: {
      inclusion: ['in-progress', 'completed'],
      presence: true
    },
    resource: {
      inclusion: ['node', 'cluster'],
      presence: true
    },
    resource_id: {
      presence: true
    }
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
