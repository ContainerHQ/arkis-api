'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  config = require('../../config'),
  AgentManager = require('../../app/services').AgentManager;

describe('AgentManager Service', () => {
  let manager, cluster;

  beforeEach(() => {
    cluster = factory.buildSync('deployingCluster', {
      last_seen: moment
    });

    return cluster.save().then(cluster => {
      return cluster.createNode(factory.buildSync('node').dataValues);
    }).then(node => {
      manager = new AgentManager(node);
    });
  });

  describe('#infos', () => {
    it('returns infos required by the agent', () => {
      let expected = {
        docker: {
          port:    config.agent.ports.docker,
          version: config.latestVersions.docker,
          name:    manager.node.name,
          labels:  manager.node.labels,
          cert:    cluster.cert
        },
        swarm: {
          port:     config.agent.ports.swarm,
          version:  config.latestVersions.swarm,
          strategy: cluster.strategy,
          master:   manager.node.master
        },
      };
      return expect(manager.infos()).to.eventually.deep.equal(expected);
    });
  });

  describe('#notify', () => {
    context('with valid attributes', () => {
      const ATTRIBUTES = { docker_version: '1.2.0', disk: 2 };

      beforeEach(() => {
        return manager.notify(ATTRIBUTES).then(() => {
          return manager.node.reload();
        });
      });

      it('updates the node with attributes', () => {
        expect(manager.node).to.include(ATTRIBUTES);
      });

      itSetsTheNodeLastStateToRunnning();
      itNotifiesTheClusterWithLastState();
    });

    context('with empty attributes', () => {
      beforeEach(() => {
        return manager.notify().then(() => {
          return manager.node.reload();
        });
      });

      itSetsTheNodeLastStateToRunnning();
      itNotifiesTheClusterWithLastState();
    });

    context('when node is in deploying state', () => {
      let clock;

      beforeEach(() => {
        return manager.node.update({ last_state: 'deploying' }).then(() => {
          clock = sinon.useFakeTimers();
          return manager.notify();
        }).then(() => {
          return manager.node.reload();
        });
      });

      afterEach(() => {
        clock.restore();
      });

      it('updates node deployed_at to current datetime', () => {
        expect(manager.node.deployed_at).to.deep.equal(moment().toDate());
      });
    });

    context('node is not in deploying state', () => {
      let deployedAt;

      beforeEach(() => {
        deployedAt = manager.node.deployed_at;
        return manager.node.update({ last_state: 'updating' }).then(() => {
          return manager.notify();
        }).then(() => {
          return manager.node.reload();
        });
      });

      it("doesn't change node deployed_at", () => {
        expect(manager.node.deployed_at).to.deep.equal(deployedAt);
      });
    });

    context('when node has a pending action', () => {
      let action, result;

      beforeEach(() => {
        return manager.node.createAction({ type: 'deploy' })
        .then(nodeAction => {
          action = nodeAction;
          return manager.notify();
        }).then(notifyResult => {
          result = notifyResult;
          return manager.node.reload();
        }).then(() => {
          return action.reload();
        });
      });

      it('returns the action', () => {
        expect(result.toJSON()).to.deep.equal(action.toJSON());
      });

      it('set this action in completed state', () => {
        expect(action.state).to.deep.equal('completed');
      });

      it('sets this action completed_at to current datetime', () => {
        expect(moment(action.completed_at).fromNow())
          .to.equal('a few seconds ago');
      });
    });

    context('when node has a no pending action', () => {
      let action, result;

      beforeEach(() => {
        return manager.node.createAction(
          { type: 'deploy', last_state: 'completed' }
        ).then(nodeAction => {
          action = nodeAction;
          return manager.notify();
        }).then(notifyResult => {
          result = notifyResult;
          return manager.node.reload();
        });
      });

      it('returns null', () => {
        expect(result).to.be.null;
      });

      it("doesn't complete this action", () => {
        let previousValues = action.dataValues;

        return expect(action.reload())
          .to.eventually.have.property('dataValues')
          .that.deep.equals(previousValues);
      });
    });

    context('with invalid attributes', () => {
      const ATTRIBUTES = { memory: -1 };

      let actualErr;

      beforeEach(done => {
        manager.notify(ATTRIBUTES).then(done).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns a validation error', done => {
        manager.node.update(ATTRIBUTES).then(done).catch(err => {
          expect(actualErr).to.deep.equal(err);
          done();
        });
      });

      it("doesn't update the node with attributes", () => {
        return expect(manager.node.reload())
          .to.eventually.not.include(ATTRIBUTES);
      });

      it("doesn't set the node last_state to running", () => {
        return expect(manager.node.reload())
          .to.eventually.not.have.property('last_state', 'running');
      });

      it("doesn't notify the cluster", () => {
        return expect(manager.node.getCluster())
          .to.eventually.not.have.property('state', 'running');
      });
    });

    function itSetsTheNodeLastStateToRunnning() {
      it('sets the node last_state to running', () => {
        expect(manager.node.last_state).to.equal('running');
      });
    }

    function itNotifiesTheClusterWithLastState() {
      it('notifies the cluster with last_state', () => {
        return expect(manager.node.getCluster())
          .to.eventually.have.property('state', 'running');
      });
    }
  });

  describe('#register', () => {
    let clock;

    /*
     * We are faking the time and increasing it a bit here to ensure that
     * last_seen is properly set to the current date and time.
     */
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      clock.tick(random.integer({ min: 10, max: 1000 }));
    });

    afterEach(() => {
      clock.restore();
    });

    [undefined, null, '', ':', 'invalid'].forEach(addr => {
      context(`with address: "${addr}"`, () => {
        let actualErr, previousLastSeen;

        beforeEach(done => {
          previousLastSeen = manager.node.last_seen;
          manager.register(addr).then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        it('returns a validation error', done => {
          manager.node.update({ public_ip: addr || 'null' })
          .then(done).catch(err => {
            expect(actualErr).to.deep.equal(err);
            done();
          });
        });

        it("doesn't update node last_seen", () => {
          return expect(manager.node.reload())
            .to.eventually.have.property('last_seen', previousLastSeen);
        });
      });
    });

    context('when address is valid', () => {
      let ip;

      beforeEach(() => {
        ip = random.ip() ;
        return manager.register(ip+':2375').then(() => {
          return manager.node.reload();
        });
      });

      it('updates node public_ip with this address ip', () => {
        expect(manager.node.public_ip).to.equal(ip);
      });

      it('updates node last_seen to current datetime', () => {
        expect(manager.node.last_seen).to.deep.equal(moment().toDate());
      });
    });

  });

  describe('#fetch', () => {
    context('when node is not master', () => {
      let actualErr, previousLastSeen;

      beforeEach(done => {
        previousLastSeen = cluster.last_seen;
        manager.node.update({ master: false }).then(() => {
          return manager.fetch();
        }).catch(err => {
          actualErr = err;
          done();
        });
      });

      it('returns an error', () => {
        expect(actualErr).to.deep.equal(new errors.NotMasterError());
      });

      it("doesn't update the node cluster ping", () => {
        return expect(cluster.reload())
          .to.eventually.have.property('last_seen')
          .that.deep.equals(previousLastSeen);
      });
    });

    context('when node is master', () => {
      let clock, actualAddresses;

      beforeEach(() => {
        return manager.node.update({ master: true }).then(() => {
          return prepareNodesFor(cluster);
        }).then(() => {
          clock = sinon.useFakeTimers();
          return manager.fetch();
        }).then(addresses => {
          actualAddresses = addresses;
          return cluster.reload();
        });
      });

      afterEach(() => {
        clock.restore();
      });

      it("updates node's cluster ping", () => {
        expect(cluster.last_seen).to.deep.equal(moment().toDate());
      });

      it('returns running nodes existing addresses', done => {
        getNodeAddresses().then(nodesAddresses => {
          expect(actualAddresses).to.deep.equal(nodesAddresses)
            .and.not.to.be.empty;
          done();
        }).catch(done);
      });
    });

    function getNodeAddresses() {
      return cluster.getNodes().then(nodes => {
        return _.filter(nodes, 'state', 'running');
      }).then(nodes => {
        return _.map(nodes, 'public_ip');
      }).then(nodes => {
        return _.remove(nodes, null);
      }).then(nodesIPs => {
        return _.map(nodesIPs, ip => {
          return `${ip}:${config.agent.ports.docker || '0000'}`;
        });
      });
    }

    function prepareNodesFor(cluster) {
      return new Promise((resolve, reject) => {
        let opts = { cluster_id: cluster.id };

        /*
         * Creates some nodes in deploying state without a public_ip.
         */
        factory.createMany('node', opts, 10, err => {
          if (err) { return reject(err); }

          let opts = {
            cluster_id: cluster.id,
            last_state: 'running',
            last_seen: Date.now,
            public_ip: random.ip
          };
          /*
           * Creates some nodes in running state with a public_ip.
           */
          factory.createMany('node', opts, 5, err => {
            if (err) { return reject(err); }

            /*
             * Creates some nodes in running state without a public_ip.
             */
            let opts = {
              cluster_id: cluster.id,
              last_state: 'running',
              last_seen: Date.now,
              public_ip: null
            };

            factory.createMany('node', opts, 3, err => {
              let opts = {
                cluster_id: cluster.id,
                last_state: 'upgrading',
                public_ip: random.ip
              };

              /*
               * Creates some nodes in upgrading state with a public_ip .
               */
              factory.createMany('node', opts, 7, err => {
                if (err) { reject(err); }

                return resolve();
              });
            });
          });
        });
      });
    }
  });
});
