'use strict';

var _ = require('lodash'),
  config = require('../../config'),
  models = require('../../app/models'),
  errors = require('../../app/support').errors,
  Node = require('../../app/models').Node,
  MachineManager = require('../../app/services').MachineManager;

const BYON_OPTS = { byon: true, region: null, size: null };

describe('MachineManager Service', () => {
  let manager;

  beforeEach(() => {
    let cluster = factory.buildSync('cluster'),
        node    = factory.buildSync('node');

    return cluster.save().then(() => {
      manager = new MachineManager(cluster, node);
    });
  });

  describe('.constructor', () => {
    it('initializes machine with config credentials', () => {
      expect(manager.machine.credentials).to.equal(config.auth.machine);
    });
  });

  describe('#deploy', () => {
    let action;

    context('when node validations failed', () => {
      let actualError;

      beforeEach(done => {
        manager.node.name = null;
        manager.machine.create = sinon.stub();
        manager.deploy().then(done).catch(err => {
          actualError = err;
          done();
        });
      });

      it('returns a validation error', done => {
        manager.node.save().then(done).catch(err => {
          expect(actualError).to.deep.equal(err);
          done();
        });
      });

      itDoesntCreateAMachineBehind();
      itDoesntNotifyTheCluster();
      itDoesntCreateAnAction();
    });

    context('when machine creation succeeded', () => {
      let machineId;

      beforeEach(() => {
        machineId = random.string();
        manager.machine.create = sinon.stub().returns(Promise.resolve(machineId));
        return manager.deploy().then(nodeAction => {
          action = nodeAction;
        });
      });

      itCreatesTheNode();
      itAddsTheNodeToTheCluster();
      itNotifiesTheCluster();
      itCreatesADeployActionForTheNode();

      it('creates the machine behind with specified options', () => {
        expect(manager.machine.create).to.have.been.calledWith({
          name: manager.node.id,
          region: manager.node.region,
          size: manager.node.size
        });
      });

      it('adds the machine id to the node', () => {
        expect(manager.node.provider_id).to.equal(machineId);
      });
    });

    context('when machine creation failed', () => {
      const ERROR = random.error();

      let actualError;

      beforeEach(done => {
        manager.machine.create = sinon.stub().returns(Promise.reject(ERROR));
        manager.deploy().then(done).catch(err => {
          actualError = err;
          done();
        });
      });

      it('returns the error', () => {
        expect(actualError).to.equal(ERROR);
      });

      it("doesn't create the node", () => {
        expect(manager.node.isNewRecord).to.be.true;
      });

      itDoesntNotifyTheCluster();
      itDoesntCreateAnAction();
    });

    context('when byon node', () => {
      beforeEach(() => {
        _.merge(manager.node, BYON_OPTS);

        manager.machine.create = sinon.stub().returns(Promise.resolve());
        return manager.deploy().then(nodeAction => {
          action = nodeAction;
        });
      });

      itCreatesTheNode();
      itAddsTheNodeToTheCluster();
      itDoesntCreateAMachineBehind();
      itNotifiesTheCluster();
      itCreatesADeployActionForTheNode();
    });

    function itCreatesTheNode() {
      it('creates the node', () => {
        expect(manager.node.isNewRecord).to.be.false;
      });
    }

    function itDoesntNotifyTheCluster() {
      it("doesn't notify the cluster", () => {
        expect(manager.cluster.state).to.equal('empty');
      });
    }

    function itDoesntCreateAMachineBehind() {
      it("doesn't create a machine behind", () => {
        expect(manager.machine.create).to.not.have.been.called;
      });
    }

    function itDoesntCreateAnAction() {
      it("doesn't create an action", () => {
        return expect(manager.node.getActions()).to.eventually.be.empty;
      });
    }

    function itAddsTheNodeToTheCluster() {
      it('adds the node to the cluster', () => {
        expect(manager.node.cluster_id).to.equal(manager.cluster.id);
      });
    }

    function itNotifiesTheCluster() {
      it('notifies the cluster', () => {
        expect(manager.cluster.state).to.equal('deploying');
      });
    }

    function itCreatesADeployActionForTheNode() {
      it('creates and returns a deploy action for the node', () => {
        expect(action).to.include({
          type: 'deploy',
          state: 'in-progress',
          completed_at: null,
          resource: 'node',
          resource_id: manager.node.id,
          isNewRecord: false
        });
      });
    }
  });

  describe('#destroy', () => {
    let action;

    beforeEach(() => {
      return manager.deploy().then(nodeAction => {
        action = nodeAction;
      });
    });

    context('when byon node', () => {
      beforeEach(() => {
        return manager.node.update(BYON_OPTS).then(() => {
          manager.machine.delete = sinon.stub().returns(Promise.resolve());
          return manager.destroy();
        });
      });

      itRemovesTheNode();
      itNotifiesTheClusterWithLastState();
      itRemovesNodeActions();

      it("doesn't delete the machine behind", () => {
        expect(manager.machine.delete).to.not.have.been.called;
      });
    });

    context('when machine removal succeeded', () => {
      let machineId;

      beforeEach(() => {
        machineId = random.string();
        manager.machine.delete = sinon.stub().returns(Promise.resolve());
      });

      context('when node is a master', () => {
        beforeEach(() => {
          return manager.cluster.update({ last_seen: Date.now() })
          .then(() => {
            return manager.node.update({
              master: true, provider_id: machineId
            });
          }).then(() => {
            return manager.destroy();
          });
        });

        itRemovesTheNode();
        itNotifiesTheClusterWithLastState();
        itRemovesNodeActions();

        it('removes the machine behind', () => {
          expect(manager.machine.delete).to.have.been.calledWith(machineId);
        });

        it('notifies the cluster with last_seen', () => {
          expect(manager.cluster.last_seen).to.be.null;
        });
      });

      context('when node is a slave', () => {
        beforeEach(() => {
          return manager.cluster.update({ last_seen: Date.now() })
          .then(() => {
            return manager.node.update({
              master: false, provider_id: machineId
            });
          }).then(() => {
            return manager.destroy();
          });
        });

        itRemovesTheNode();
        itNotifiesTheClusterWithLastState();
        itRemovesNodeActions();

        it('removes the machine behind', () => {
          expect(manager.machine.delete).to.have.been.calledWith(machineId);
        });

        it("doens't notify the cluster with last_seen", () => {
          expect(manager.cluster.last_seen).to.not.be.null;
        });
      });
    });

    context('when machine removal failed', () => {
      let actualError;

      context('with MachineNotFoundError', () => {
        beforeEach(() => {
          manager.machine.delete = sinon.stub().returns(
            Promise.reject(new errors.MachineNotFoundError())
          );
        });

        it('ignores the error', () => {
          return expect(manager.destroy()).to.be.fulfilled;
        });
      });

      [
        'MachineCredentialsError',
        'MachineUnprocessableError'
      ].forEach(type => {
        context(`with ${type}`, () => {
          let expectedError = new errors[type](random.string());

          beforeEach(done => {
            manager.machine.delete = sinon.stub().returns(
              Promise.reject(expectedError)
            );
            manager.destroy().then(done).catch(err => {
              actualError = err;
              done();
            });
          });

          it('returns the error', () => {
            expect(actualError).to.equal(expectedError);
          });

          it("doesn't remove the node", () => {
            return expect(Node.findById(manager.node.id))
              .to.eventually.exist;
          });

          it("doesn't notify the cluster", () => {
            expect(manager.cluster.state).to.equal('deploying');
          });
        });
      });
    });

    function itRemovesTheNode() {
      it('removes the node', () => {
        return expect(Node.findById(manager.node.id))
          .to.eventually.not.exist;
      });
    }

    function itNotifiesTheClusterWithLastState() {
      it('notifies the cluster with last_state', () => {
        expect(manager.cluster.state).to.equal('empty');
      });
    }

    function itRemovesNodeActions() {
      it('removes its actions', () => {
        return expect(models.Action.findById(action.id)).to.eventually.be.null;
      });
    }
  });

});
