'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  concerns = require('./concerns'),
  config = require('../../config'),
  support = require('../../app/support'),
  models = require('../../app/models');

const SERIALIZATION = {
  omit:  ['token', 'encrypted_token', 'provider_id', 'last_state', 'addr'],
  links: ['actions']
};

describe('Node Model', () => {
  db.sync();

  concerns('node').behavesAsAStateMachine({
    attribute: {
      name: 'last_state',
      default: 'deploying',
      values: ['deploying', 'upgrading', 'updating', 'running']
    },
    expiration: {
      when: 'running',
      mustBe: 'unreachable',
      constraint: {
        name: 'last_seen'
      },
      after: config.agent.heartbeat
    }
  });

  concerns('node').serializable(
    _.merge({ merge: { agent_cmd: null } }, SERIALIZATION)
  );

  concerns('byonNode').serializable(SERIALIZATION);

  concerns('node').has({
    default: {
      master:      false,
      byon:        false,
      deployed_at: null,
      labels:      {}
    }
  });

  concerns('node').validates({
    name: {
      uniqueness: { scope: 'cluster', type: 'string' },
      subdomainable: true
    },
    master: {
      presence: true,
      uniqueness: { scope: 'cluster', value: true }
    },
    byon: {
      presence: true,
      incompatible: ['region', 'size']
    },
    labels: {
      presence: true,
      exclusion: ['lol', 2, []]
    },
    public_ip: {
      is: 'ip',
      uniqueness: { type: 'ip' }
    },
    cpu: {
      length: { min: 1,   max: 4000000 }
    },
    memory: {
      length: { min: 128, max: 4000000 }
    },
    disk: {
      length: { min: 1.0, max: 4000000.0 }
    },
    region: {
      presence: true
    },
    size: {
      presence: true
    }
  });

  concerns('registeredNode').validates();

  describe('#create', () => {
    let node, cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');

      return cluster.save().then(() => {
        node = factory.buildSync('node', { cluster_id: cluster.id });
        return node.save();
      });
    });

    it('has a fqdn with its name and cluster_id', () => {
      let shortId = cluster.id.slice(0, 8),
        expected  = `${node.name}-${shortId}.node.${config.domain || '.'}`;

      expect(node.fqdn).to.equal(expected);
    });

    it('initializes its jwt token', () => {
      expect(node).to.satisfy(has.validJWT);
    });

    it('has a command to get the agent', () => {
      let agentCmd = `${config.agent.cmd || '.'} ${node.token || '.'}`;

      expect(node.agent_cmd).to.equal(agentCmd);
    });

    it('stores its token as a encrypted text', () => {
      expect(node).to.satisfy(
        has.encrypted('token', { algorithm: 'aes' })
      );
    });
  });

  describe('#update', () => {
    context('when updating public_ip', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save();
      });

      afterEach(() => {
        support.fqdn.register.restore();
      });

      context('when fqdn registration succeeded', () => {
        beforeEach(() => {
          sinon.stub(support.fqdn, 'register').returns(Promise.resolve());
        });

        it('registers this ip for the fqdn', () => {
          return node.update({ public_ip: '192.168.1.90' }).then(() => {
            return expect(support.fqdn.register)
              .to.have.been
              .calledWithMatch(_.pick(node, ['fqdn', 'public_ip']));
          });
        });
      });

      context('when fqdn registration failed', () => {
        const ERROR = random.error(),
              OPTS  = { public_ip: '192.168.1.90' };

        beforeEach(() => {
          sinon.stub(support.fqdn, 'register').returns(Promise.reject(ERROR));
        });

        it('returns the error', () => {
          return expect(node.update(OPTS)).to.be.rejectedWith(ERROR);
        });

        it("doesn't update the node", done => {
          return node.update(OPTS).then(done).catch(err => {
            expect(node.reload())
              .to.eventually.not.include(OPTS)
              .notify(done);
          });
        });
      });
    });

    context('when updating name', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save().then(() => {
          sinon.stub(support.fqdn, 'register', support.fqdn.register);
        });
      });

      afterEach(() => {
        support.fqdn.register.restore();
      });

      it('registers this ip with the new fqdn', () => {
        return node.update({ name: 'new-name-prod' }).then(() => {
          return expect(support.fqdn.register)
            .to.have.been
            .calledWithMatch(_.pick(node, ['fqdn', 'public_ip']));
        });
      });
    });

    context('when not updating public_ip or name', () => {
      let node;

      beforeEach(() => {
        node = factory.buildSync('node');
        return node.save();
      });

      beforeEach(() => {
        sinon.stub(support.fqdn, 'register', support.fqdn.register);
      });

      afterEach(() => {
        support.fqdn.register.restore();
      });

      it("doesn't registers the public_ip for the fqdn", () => {
        return node.update({ cpu: 23 }).then(() => {
          return expect(support.fqdn.register).to.not.have.been.called;
        });
      })
    });
  });

  describe('#destroy', () => {
    let node;

    beforeEach(() => {
      node = factory.buildSync('node');
      return node.save();
    });

    context('when fqdn deletion succeeded', () => {
      beforeEach(() => {
        sinon.stub(support.fqdn, 'unregister', support.fqdn.unregister);
        return node.destroy();
      });

      afterEach(() => {
        support.fqdn.unregister.restore();
      });

      it('removes the fqdn', () => {
        expect(support.fqdn.unregister).to.have.been.calledWith(node.fqdn);
      });

      it('deletes the node', () => {
        return expect(models.Node.findById(node.id)).to.eventually.not.exist;
      });
    });

    context('when machine fqdn deletion failed', () => {
      const ERROR = random.error();

      beforeEach(() => {
        sinon.stub(support.fqdn, 'unregister')
          .returns(Promise.reject(ERROR));
      });

      afterEach(() => {
        support.fqdn.unregister.restore();
      });

      it('returns the error', () => {
        return expect(node.destroy()).to.be.rejectedWith(ERROR);
      });

      it("doesn't delete the node", done => {
        node.destroy().then(done).catch(err => {
          expect(models.Node.findById(node.id))
            .to.eventually.exist
            .notify(done);
        });
      });
    });
  });
});
