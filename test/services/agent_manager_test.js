'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../support').errors,
  config = require('../../config'),
  AgentManager = require('../../app/services').AgentManager;

const CLUSTER_INFOS = ['docker_version', 'swarm_version', 'strategy', 'cert'],
      NODE_INFOS    = ['name', 'master', 'labels'],
      CONFIG_INFOS  = ['dockerPort', 'swarmPort'];

describe('AgentManager Service', () => {
  let cluster, node, manager;

  beforeEach(() => {
    cluster = factory.buildSync('cluster');
    return cluster.save().then(cluster => {
      node = factory.buildSync('node', { cluster_id: cluster.id });
      return node.save();
    }).then(node => {
      manager = new AgentManager(node);
    });
  });

  describe('#infos', () => {
    it('returns infos required by the agent', () => {
      let expected = _.merge(
        _.pick(cluster, CLUSTER_INFOS),
        _.pick(node,    NODE_INFOS),
        _(config)
        .pick(CONFIG_INFOS)
        .mapKeys((value, key) => {
          return _.snakeCase(key);
        }).value()
      );
      return expect(manager.infos()).to.eventually.deep.equal(expected);
    });
  });

  describe('#notify', () => {
    context('with valid attributes', () => {
      const ATTRITBUTES = { docker_version: '1.2.0', disk: 2 };

      beforeEach(() => {
        return manager.notify(ATTRITBUTES).then(() => {
          return node.reload();
        });
      });

      it('updates the node with attributes', () => {
        expect(node).to.include(ATTRITBUTES);
      });

      it('sets the node last_state to running', () => {
        expect(node.last_state).to.equal('running');
      });
    });

    context('with empty attributes', () => {
      beforeEach(() => {
        return manager.notify().then(() => {
          return node.reload();
        });
      });

      it('sets the node last_state to running', () => {
        expect(node.last_state).to.equal('running');
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
        node.update(ATTRIBUTES).then(done).catch(err => {
          expect(actualErr).to.deep.equal(err);
          done();
        });
      });

      it("doesn't update the node with attributes", () => {
        return expect(node.reload()).to.eventually.not.include(ATTRIBUTES);
      });

      it("doesn't set the node last_state to running", () => {
        return expect(node.reload())
          .to.eventually.not.have.property('last_state', 'running');
      });
    });
  });

  describe('#register', () => {
    let clock;

    /*
     * We are faking the time and increasing it a bit here to ensure that
     * last_ping is properly set to the current date and time.
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
        let actualErr, previousLastPing;

        beforeEach(done => {
          previousLastPing = node.last_ping;
          manager.register(addr).then(done).catch(err => {
            actualErr = err;
            done();
          });
        });

        it('returns a validation error', done => {
          node.update({ public_ip: addr || 'null' }).then(done).catch(err => {
            expect(actualErr).to.deep.equal(err);
            done();
          });
        });

        it("doesn't update node last_ping", () => {
          return expect(node.reload())
            .to.eventually.have.property('last_ping', previousLastPing);
        });
      });
    });

    context('when addr is valid', () => {
      let ip;

      beforeEach(() => {
        ip = random.ip() ;
        return manager.register(ip+':2375').then(() => {
          return node.reload();
        });
      });

      it('updates node public_ip with this address ip', () => {
        expect(node.public_ip).to.equal(ip);
      });

      it('updates node last_ping to current datetime', () => {
        expect(node.last_ping).to.deep.equal(moment().toDate());
      });
    });

  });

  describe('#fetch', () => {
    context('when node is not master', () => {
      let actualErr;

      beforeEach(done => {
        node.update({ master: false }).then(() => {
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

      });
    });

    context('when node is master', () => {
      beforeEach(() => {
        return node.update({ master: true });
      });

      it('updates the node cluster ping', () => {

      });
    });
  });
});
