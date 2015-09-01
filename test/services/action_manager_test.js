'use strict';

let _ = require('lodash'),
  ActionManager = require('../../app/services').ActionManager;

describe('ActionManager Service', () => {
  let node, manager;

  beforeEach(() => {
    node = factory.buildSync('node');
    return node.save().then(() => {
      manager = new ActionManager(node);
      return prepareVariousActions();
    });
  });

  describe('.constructor', () => {
    it('initializes its model with given object', () => {
      expect(manager.model).to.equal(node);
    });
  });

  describe('#add', () => {
    const ACTION_TYPE = 'deploy';

    context('with valid action type', () => {
      let action;

      beforeEach(() => {
        return manager.add(ACTION_TYPE).then(createdAction => {
          action = createdAction;
        });
      });

      it('creates a persistent action', () => {
        expect(action.isNewRecord).to.be.false;
      });

      it('creates an action with given type', () => {
        expect(action.type).to.equal(ACTION_TYPE)
      });

      it('creates an action for its model', () => {
        expect(action).to.include({
          resource: 'Node',
          resource_id: node.id
        });
      });
    });

    context('with invalid model', () => {
      beforeEach(() => {
        return factory.buildSync('user').save().then(user => {
          manager.model = user;
        });
      });

      it('returns a validation error', () => {
        return expect(manager.add(ACTION_TYPE)).to.be.rejected;
      });
    });

    context('with invalid action type', () => {
      it('returns a validation error', () => {
        return expect(manager.add('plop')).to.be.rejected;
      });
    });
  });

  describe('#list', () => {
    const ACTION_COUNT = 10, LIMIT = random.positiveInt(ACTION_COUNT);

    let modelActions, opts;

    beforeEach(done => {
      opts = { type: 'deploy', resource: 'Node', resource_id: node.id };

      factory.createMany('action', opts, ACTION_COUNT, (err, actions) => {
        if (err) { return done(err); }

        modelActions = sortActions(actions);
        done();
      });
    });

    it('returns the model actions', () => {
      return expect(manager.list().then(res => {
        return _.pluck(res.rows, 'dataValues');
      }).then(actions => {
        return expect(actions).to.deep.equal(modelActions);
      }));
    });

    context('with a specific limit', () => {
      const OPTS = { limit: LIMIT };

      it('returns a limited number of actions', () => {
        return expect(manager.list(OPTS).then(res => {
          let actions = _.pluck(res.rows, 'dataValues'),
            expected  = _.slice(modelActions, 0, OPTS.limit);

          return expect(actions).to.deep.equal(expected);
        }));
      });

      context('with a specific offset', () => {
        const MAX = LIMIT > 1 ? LIMIT - 1 : LIMIT,
          OPTS = { offset: random.positiveInt(MAX), limit: LIMIT };

        it('returns the model actions starting from this offset ', () => {
          return expect(manager.list(OPTS).then(res => {
            let actions = _.pluck(res.rows, 'dataValues'),
              expected  = _.slice(modelActions,
                OPTS.offset,
                OPTS.offset + OPTS.limit
              );

            return expect(actions).to.deep.equal(expected);
          }));
        });
      });

      context('with a specific type filter', () => {
        const OPTS = { filters: { type: 'update' } };

        beforeEach(done => {
          _.merge(opts, OPTS.filters);

          factory.createMany('action', opts, ACTION_COUNT, (err, actions) => {
            if (err) { return done(err); }

            modelActions = sortActions(actions);
            done();
          });
        });

        it('returns the actions filterd by type', () => {
          return expect(manager.list(OPTS).then(res => {
            return _.pluck(res.rows, 'dataValues');
          }).then(actions => {
            return expect(actions).to.deep.equal(modelActions);
          }));
        });
      });
    });

    function sortActions(actions) {
      return _(actions)
      .pluck('dataValues')
      .sortBy('started_at')
      .reverse()
      .value();
    }
  });

  describe('#getLatest', () => {
    context('when model has actions', () => {
      let actions;

      beforeEach(done => {
        let opts = { type: 'deploy', resource: 'Node', resource_id: node.id };

        factory.createMany('action', opts, 10, (err, nodeActions) => {
          if (err) { return done(err); }

          actions = nodeActions;
          done();
        });
      });

      it('returns the latest action of the model', () => {
        return expect(manager.getLatest())
          .to.eventually.have.property('dataValues')
          .that.deep.equals(_.last(actions).dataValues);
      });
    });

    context('when model has no actions', () => {
      it('returns null', () => {
        return expect(manager.getLatest()).to.eventually.be.null;
      });
    });
  });

  describe('#getById', () => {
    context('when action belong to the model', () => {
      let action;

      beforeEach(() => {
        let opts = {
          type: 'update', resource: 'Node', resource_id: manager.model.id
        };
        action = factory.buildSync('action', opts);
        return action.save();
      });

      it('returns the action', () => {
        return expect(manager.getById(action.id))
          .to.eventually.have.property('dataValues')
          .that.deep.equals(action.dataValues);
      });
    });

    context("when action doesn't belong to the model", () => {
      let action;

      beforeEach(() => {
        return factory.buildSync('cluster').save().then(cluster => {
          let opts = {
            type: 'update', resource: 'Cluster', resource_id: cluster.id
          };
          action = factory.buildSync('action', opts);
          return action.save();
        });
      });

      it('returns null', () => {
        return expect(manager.getById(action.id)).to.eventually.be.null;
      });
    });
  });

  /*
   * Prepare actions for another resource/id to be sure that we are
   * properly getting only actions for a specfic resource/resource_id combo.
   */
  function prepareVariousActions() {
    return factory.buildSync('cluster').save()
    .then(cluster => {
      let opts = {
        type: 'deploy', resource: 'Cluster', resource_id: cluster.id
      };

      return new Promise((resolve, reject) => {
        factory.createMany('action', opts, 10, err => {
          if (err) { return reject(err); }

          resolve();
        });
      });
    }).then(() => {
      return factory.buildSync('node').save();
    }).then(node => {
      let opts = {
        type: 'update', resource: 'Node', resource_id: node.id
      };

      return new Promise((resolve, reject) => {
        factory.createMany('action', opts, 10, err => {
          if (err) { return reject(err); }

          resolve();
        });
      });
    });
  }
});
