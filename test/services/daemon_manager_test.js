'use strict';

var _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  Node = require('../../app/models').Node,
  DaemonManager = require('../../app/services').DaemonManager;

const RUNNING_OPTS = { last_state: 'running', last_seen: Date.now() };

describe('DaemonManager Service', () => {
  let manager, actualErr, expectedError;

  beforeEach(() => {
    let cluster = factory.buildSync('cluster');

    return cluster.save().then(() => {
      return cluster.createNode(factory.buildSync('runningNode').dataValues);
    }).then(node => {
      manager = new DaemonManager(cluster, node);
    });
  });

  describe('.constructor', () => {
    it('initializes daemon with the same node', () => {
      expect(manager.daemon.node).to.equal(manager.node);
    });
  });

  describe('#update', () => {
    let changes;

    context('when node is not running', () => {
      beforeEach(done => {
        changes = { name: random.string() };

        manager.node.update({ last_state: 'deploying' }).then(() => {
          manager.daemon.update = sinon.stub();
          return manager.update(changes);
        }).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns a state error', () => {
        expectedError = new errors.StateError('update', manager.node.state);

        expect(actualErr).to.deep.equal(expectedError);
      });

      itsNodeIsNot('updating');
      itDoesntCallDaemon('update');
      itsClusterIsNotNotifiedWith('updating');
      itDoesntCreateAnAction();
      itDoesntUpdateNodeAttributes();
    });

    context('when changes are empty', () => {
      let action;

      beforeEach(() => {
        manager.daemon.update = sinon.stub();
        return manager.update({}).then(nodeAction => {
          action = nodeAction;
        });
      });

      itsNodeIsNot('updating');
      itDoesntCallDaemon('update');
      itsClusterIsNotNotifiedWith('updating');
      itDoesntCreateAnAction();

      it('returns a null action', () => {
        expect(action).to.be.null;
      });
    });

    context('when validations failed', () => {
      beforeEach(done => {
        changes = { name: null };

        manager.daemon.update = sinon.stub();
        return manager.update(changes).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      beforeEach(() => {
        return manager.node.reload();
      });

      it('returns validation errors', done => {
        manager.node.update(changes).then(done).catch(err => {
          expect(actualErr).to.deep.equal(err);
          done();
        });
      });

      itsNodeIsNot('updating');
      itDoesntUpdateNodeAttributes();
      itDoesntCallDaemon('update');
      itsClusterIsNotNotifiedWith('updating');
      itDoesntCreateAnAction();
    });

    context('when daemon update succeeded', () => {
      beforeEach(() => {
        manager.daemon.update = sinon.stub().returns(Promise.resolve());
      });

      context('when changes are not empty', () => {
        let now, action;

        beforeEach(() => {
          changes = { name: random.string() };
          now     = Date.now();

          return manager.cluster.update({ last_seen: now }).then(() => {
            return manager.update(changes);
          }).then(nodeAction => {
            action = nodeAction;
          });
        });

        it('creates and returns an update node action', () => {
          return expect(action.reload()).to.eventually.include({
            type: 'update',
            state: 'in-progress',
            completed_at: null,
            resource: 'node',
            resource_id: manager.node.id,
            isNewRecord: false
          });
        });

        it('node is updating', () => {
          return expect(manager.node.reload())
            .to.eventually.have.property('state', 'updating');
        });

        it('updates the node', () => {
          return expect(manager.node.reload()).to.eventually.include(changes);
        });

        it('updates the daemon', () => {
          expect(manager.daemon.update).to.have.been.calledWith(changes);
        });

        it('notifies the cluster', () => {
          return expect(manager.cluster.reload())
            .to.eventually.have.property('state', 'updating');
        });

        it("doesn't notify the cluster with last_seeen", () => {
          return expect(manager.cluster.reload().then(() => {
            let clusterPing = moment(manager.cluster.last_seen).toDate(),
              expectedPing  = moment(now).toDate();

            return expect(clusterPing).to.deep.equal(expectedPing);
          }));
        });
      });

      context('node is promoted to master', () => {
        beforeEach(() => {
          return manager.node.update({
            last_seen: Date.now(),
            master: false
          }).then(() => {
            return manager.update({ master: true });
          });
        });

        it('notifies the cluster with last_seen value', () => {
          return expect(manager.cluster.reload())
            .to.eventually.have.property('last_seen', manager.node.last_seeen);
        });
      });

      context('node is downgraded to slave', () => {
        beforeEach(() => {
          return manager.node.update({
            last_seen: Date.now(),
            master: true
          }).then(() => {
            return manager.update({ master: false });
          });
        });

        it('notifies the cluster with null last_seen', () => {
          return expect(manager.cluster.reload())
            .to.eventually.have.property('last_seen').to.be.null;
        });
      });
    });

    context('when daemon update failed', () => {
      beforeEach(done => {
        changes       = { master: true };
        expectedError = random.error();

        manager.daemon.update = sinon.stub().returns(Promise.reject(expectedError));
        return manager.update(changes).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      itReturnsTheError();
      itsNodeIsNot('updating');
      itsClusterIsNotNotifiedWith('updating');
      itDoesntCreateAnAction();
      itDoesntUpdateNodeAttributes();
    });

    function itDoesntUpdateNodeAttributes() {
      it("doesn't update the node attributes", () => {
        return expect(manager.node.reload()).to.eventually.not.include(changes);
      });
    }
  });

  describe('#upgrade', () => {
    context('when node is not running', () => {
      let actualErr;

      beforeEach(done => {
        manager.daemon.upgrade = sinon.stub();
        manager.node.update({ last_state: 'deploying' }).then(() => {
          return manager.upgrade();
        }).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns a state error', () => {
        expectedError = new errors.StateError('upgrade', manager.node.state);

        expect(actualErr).to.deep.equal(expectedError);
      });

      itsNodeIsNot('upgrading');
      itsClusterIsNotNotifiedWith('upgrading');
      itDoesntCallDaemon('upgrade');
      itDoesntCreateAnAction();
    });

    context('when node has the same versions than cluster', () => {
      beforeEach(done => {
        manager.daemon.upgrade = sinon.stub();
        manager.node.update(
          _.pick(manager.cluster, ['docker_version', 'swarm_version'])
        ).then(() => {
          return manager.upgrade();
        }).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns a already upgraded error', () => {
        expect(actualErr).to.deep.equal(new errors.AlreadyUpgradedError());
      });

      itsNodeIsNot('upgrading');
      itsClusterIsNotNotifiedWith('upgrading');
      itDoesntCallDaemon('upgrade');
      itDoesntCreateAnAction();
    });

    context('when node has different versions than cluster', () => {
      const VERSIONS = {
        docker_version: random.string(),
        swarm_version:  random.string()
      };

      context('when daemon upgrade succeeded', () => {
        let action;

        beforeEach(() => {
          manager.daemon.upgrade = sinon.stub().returns(Promise.resolve());
          return manager.upgrade().then(nodeAction => {
            action = nodeAction;
          });
        });

        it('upgrades the daemon with cluster versions', () => {
          let expected = {
            docker: manager.cluster.docker_version,
            swarm:  manager.cluster.swarm_version
          };
          expect(manager.daemon.upgrade).to.have.been.calledWith(expected);
        });

        itsNodeIs('upgrading');
        itsClusterIsNotifiedWith('upgrading');

        it('returns a upgrade node action', () => {
          return expect(action.reload()).to.eventually.include({
            type: 'upgrade',
            state: 'in-progress',
            completed_at: null,
            resource: 'node',
            resource_id: manager.node.id,
            isNewRecord: false
          });
        });
      });

      context('when daemon upgrade failed', () => {
        beforeEach(done => {
          expectedError = random.error();

          manager.daemon.upgrade = sinon.stub().returns(Promise.reject(expectedError));
          manager.upgrade().then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        itReturnsTheError();
        itsNodeIsNot('upgrading');
        itsClusterIsNotNotifiedWith('upgrading');
        itDoesntCreateAnAction();
      });
    });
  });

  function itReturnsTheError() {
    it('returns the error', () => {
      expect(actualErr).to.equal(expectedError);
    });
  }

  function itsNodeIs(state) {
    it(`node is ${state}`, () => {
      return expect(manager.node.reload())
        .to.eventually.have.property('state', state);
    });
  }

  function itsClusterIsNotifiedWith(state) {
    it(`notifies the cluster with ${state}`, () => {
      return expect(manager.cluster.reload())
        .to.eventually.have.property('state', state);
    });
  }

  function itsClusterIsNotNotifiedWith(state) {
    it(`doesn't notify the cluster with ${state}`, () => {
      return expect(manager.cluster.reload())
        .to.eventually.not.have.property('state', state);
    });
  }

  function itsNodeIsNot(state) {
    it(`node is not ${state}`, () => {
      return expect(manager.node.reload())
        .to.eventually.not.have.property('state', state);
    });
  }

  function itDoesntCallDaemon(method) {
    it(`doesn't ${method} the daemon`, () => {
      expect(manager.daemon[method]).to.not.have.been.called;
    });
  }

  function itDoesntCreateAnAction() {
    it("doesn't create an action", () => {
      return expect(manager.node.getActions()).to.eventually.be.empty;
    });
  }
});
