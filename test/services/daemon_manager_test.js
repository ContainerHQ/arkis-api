'use strict';

var _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  Node = require('../../app/models').Node,
  DaemonManager = require('../../app/services').DaemonManager;

const RUNNING_OPTS = { last_state: 'running', last_ping: Date.now() };

describe('DaemonManager Service', () => {
  let manager;

  beforeEach(() => {
    let cluster = factory.buildSync('cluster'),
        node    = factory.buildSync('runningNode');

    return cluster.save().then(() => {
      node.cluster_id = cluster.id;
      return node.save();
    }).then(() => {
      manager = new DaemonManager(cluster, node);
    });
  });

  describe('.constructor', () => {
    it('initializes daemon with the same node', () => {
      expect(manager.daemon.node).to.equal(manager.node);
    });
  });

  describe('#update', () => {
    context('when node is not running', () => {
      const CHANGES = { name: random.string() };

      let actualErr;

      beforeEach(done => {
        manager.node.update({ last_state: 'deploying' }).then(() => {
          manager.daemon.update = sinon.stub();
          return manager.update(CHANGES);
        }).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      beforeEach(() => {
        return manager.node.reload();
      });

      it('returns a state error', () => {
        let expectedError = new errors.StateError('update', manager.node.state);

        expect(actualErr).to.deep.equal(expectedError);
      });

      it('node is not updating', () => {
        expect(manager.node.state).to.not.equal('updating');
      });

      it("doesn't update the node", () => {
        expect(manager.node).to.not.include(CHANGES);
      });

      it("doesn't update the daemon", () => {
        expect(manager.daemon.update).to.not.have.been.called;
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('updating');
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    });

    context('when changes are empty', () => {
      let action;

      beforeEach(() => {
        manager.daemon.update = sinon.stub();
        return manager.update({}).then(nodeAction => {
          action = nodeAction;
          return manager.node.reload();
        });
      });

      it('node is not updating', () => {
        expect(manager.node.state).to.not.equal('updating');
      });

      it("doesn't update the daemon", () => {
        expect(manager.daemon.update).to.not.have.been.called;
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('updating');
      });

      it('returns a null action', () => {
        expect(action).to.be.null;
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    });

    context('when validations failed', () => {
      const CHANGES = { name: null };

      let actualErr;

      beforeEach(done => {
        manager.daemon.update = sinon.stub();
        return manager.update(CHANGES).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      beforeEach(() => {
        return manager.node.reload();
      });

      it('returns validation errors', done => {
        manager.node.update(CHANGES).then(done).catch(err => {
          expect(actualErr).to.deep.equal(err);
          done();
        });
      });

      it('node is not updating', () => {
        expect(manager.node.state).to.not.equal('updating');
      });

      it("doesn't update the node", () => {
        expect(manager.node).to.not.include(CHANGES);
      });

      it("doesn't update the daemon", () => {
        expect(manager.daemon.update).to.not.have.been.called;
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('updating');
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    });

    context('when daemon update succeeded', () => {
      beforeEach(() => {
        manager.daemon.update = sinon.stub().returns(Promise.resolve());
      });

      context('when changes are not empty', () => {
        const CHANGES = { name: random.string() },
              PING    = Date.now();

        let action;

        beforeEach(() => {
          return manager.cluster.update({ last_ping: PING }).then(() => {
            return manager.update(CHANGES);
          }).then(nodeAction => {
            action = nodeAction;
            return manager.node.reload();
          });
        });

        it('creates and returns an update node action', () => {
          expect(action).to.include({
            type: 'update',
            state: 'in-progress',
            completed_at: null,
            resource: 'node',
            resource_id: manager.node.id,
            isNewRecord: false
          });
        });

        it('node is updating', () => {
          expect(manager.node.state).to.equal('updating');
        });

        it('updates the node', () => {
          expect(manager.node).to.include(CHANGES);
        });

        it('updates the daemon', () => {
          expect(manager.daemon.update).to.have.been.calledWith(CHANGES);
        });

        it('notifies the cluster', () => {
          expect(manager.cluster.state).to.equal('updating');
        });

        it("doesn't notify the cluster with the ping", () => {
          let clusterPing = moment(manager.cluster.last_ping).toDate(),
            expectedPing  = moment(PING).toDate();

          expect(clusterPing).to.deep.equal(expectedPing);
        });
      });

      context('node is promoted to master', () => {
        beforeEach(() => {
          return manager.node.update({ last_ping: Date.now() }).then(() => {
            return manager.node.update({ master: false });
          }).then(() => {
            return manager.update({ master: true });
          }).then(() => {
            return manager.node.reload();
          });
        });

        it('notifies the cluster with the ping', () => {
          expect(manager.cluster.last_ping)
            .to.deep.equal(manager.node.last_ping);
        });
      });

      context('node is downgraded to slave', () => {
        beforeEach(() => {
          return manager.cluster.update({ last_ping: Date.now() }).then(() => {
            return manager.node.update({ master: true });
          }).then(() => {
            return manager.update({ master: false });
          }).then(() => {
            return manager.node.reload();
          });
        });

        it('notifies the cluster', () => {
          expect(manager.cluster.last_ping).to.be.null;
        });
      });
    });

    context('when daemon update failed', () => {
      const ERROR = random.error(),
          CHANGES = { master: true };

      let actualErr;

      beforeEach(done => {
        manager.daemon.update = sinon.stub().returns(Promise.reject(ERROR));
        return manager.update(CHANGES).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      beforeEach(() => {
        return manager.node.reload();
      });

      it('returns the error', () => {
        expect(actualErr).to.deep.equal(ERROR);
      });

      it('node is not updating', () => {
        expect(manager.node.state).to.not.equal('updating');
      });

      it("doesn't update the node", () => {
        expect(manager.node).to.not.include(CHANGES);
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('updating');
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    });
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
        let expectedError = new errors.StateError('upgrade', manager.node.state);

        expect(actualErr).to.deep.equal(expectedError);
      });

      it('node is not upgrading', () => {
        expect(manager.node.state).to.not.equal('upgrading');
      });

      it("doesn't upgrade the daemon", () => {
        expect(manager.daemon.upgrade).to.not.have.been.called;
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('upgrading');
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    });

    context('when node has the same versions than cluster', () => {
      let actualErr;

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

      it('node is not upgrading', () => {
        expect(manager.node.state).to.not.equal('upgrading');
      });

      it("doesn't upgrade the daemon", () => {
        expect(manager.daemon.upgrade).to.not.have.been.called;
      });

      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.not.equal('upgrading');
      });

      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
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
          let expected = _.pick(manager.cluster,
            ['docker_version', 'swarm_version']
          );
          expect(manager.daemon.upgrade).to.have.been.calledWithMatch(expected);
        });

        it('node is upgrading', () => {
          expect(manager.node.state).to.equal('upgrading');
        });

        it('notifies the cluster', () => {
          expect(manager.cluster.state).to.equal('upgrading');
        });

        it('returns a upgrade node action', () => {
          expect(action).to.include({
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
        const ERROR = random.error();

        let actualErr;

        beforeEach(done => {
          manager.daemon.upgrade = sinon.stub().returns(Promise.reject(ERROR));
          manager.upgrade().then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        it('returns the error', () => {
          expect(actualErr).to.equal(ERROR);
        });

        it('node is not upgrading', () => {
          expect(manager.node.state).to.not.equal('upgrading');
        });

        it("doesn't notify the cluster", () => {
          expect(manager.cluster.state).to.not.equal('upgrading');
        });

        it("doesn't create an action", () => {
          return expect(manager.node.getActions()).to.eventually.be.empty;
        });
      });
    });
  });
});
