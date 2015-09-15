'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../../app/support').errors,
  concerns = require('./concerns'),
  config = require('../../config'),
  support = require('../../app/support'),
  models = require('../../app/models');

const SERIALIZATION = {
  omit: ['token', 'machine_id', 'last_state'],
  links: ['actions']
};

describe('Node Model', () => {
  db.sync();

  concerns('node').behavesAsAStateMachine({ default: 'deploying' });

  concerns('node').hasSubdomainable('name');

  concerns('node').serializable(SERIALIZATION);

  concerns('byonNode').serializable(
    _.merge({ merge: { agent_cmd: null } }, SERIALIZATION)
  );

  describe('validations', () => {
    /*
     * For this test we need to use a node with most of
     * the existing fields. Therefore, we are using a
     * registered node with a proper fqdn and public_ip.
     */
    it('succeeds with valid attributes', done => {
      factory.create('registeredNode', done);
    });

    it('succeeds with minimal attributes', done => {
      factory.create('node', done);
    });

    it('succeeds to create multiple slave nodes for the same cluster', done => {
      factory.create('cluster', (err, cluster) => {
        let opts = { master: false, cluster_id: cluster.id };

        factory.createMany('node', opts, 3, done);
      });
    });

    it('succeeds with the same name on different clusters', () => {
      let cluster1 = factory.buildSync('cluster'),
        cluster2 = factory.buildSync('cluster');

      return expect(cluster1.save().then(() => {
        return factory.buildSync('node', { cluster_id: cluster1.id }).save();
      }).then(() => {
        return cluster2.save();
      }).then(() => {
        return factory.buildSync('node', { cluster_id: cluster2.id }).save();
      })).to.be.fulfilled;
    });

    it('fails with null labels', () => {
      let node = factory.buildSync('node', { labels: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a string of labels', () => {
      let node = factory.buildSync('node', { labels: 'lol' });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an integer label', () => {
      let node = factory.buildSync('node', { labels: 2 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with an array of labels', () => {
      let node = factory.buildSync('node', { labels: [] });

      return expect(node.save()).to.be.rejected;
    });

    context('when in the same cluster', () => {
      let cluster;

      beforeEach(() => {
        cluster = factory.buildSync('cluster');
        return cluster.save();
      });

      it('fails with multiple node with the same name', () => {
        let opts = { name: 'test', cluster_id: cluster.id };

        return expect(factory.buildSync('node', opts).save()
        .then(() => {
          return factory.buildSync('node', opts).validate();
        })).to.eventually.exist;
      });
    });

    it('fails with an invalid public_ip', () => {
      let node = factory.buildSync('node', { public_ip: _.repeat('*', 10) });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with multiple nodes with the same ip', () => {
      let opts = { public_ip: random.ip() };

      return expect(factory.buildSync('node', opts).save()
      .then(() => {
        return factory.buildSync('node', opts).validate();
      })).to.eventually.exist
    });

    it('fails with an invalid master choice', () => {
      let node = factory.buildSync('node', { master: '' });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a null region and byon false', () => {
      let node = factory.buildSync('node', { byon: false, region: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a null size and byon false', () => {
      let node = factory.buildSync('node', { byon: false, size: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a region and byon true', () => {
      let node = factory.buildSync('node', { byon: true, size: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with a size and byon true', () => {
      let node = factory.buildSync('node', { byon: true, region: null });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with min cpu', () => {
      let node = factory.buildSync('node', { cpu: 0 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with min memory', () => {
      let node = factory.buildSync('node', { memory: 127 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails with min disk', () => {
      let node = factory.buildSync('node', { disk: 0.9999 });

      return expect(node.save()).to.be.rejected;
    });

    it('fails when master is not unique for the same cluster', () => {
      let cluster = factory.buildSync('cluster'),
        opts = { master: true };

      return expect(cluster.save().then(() => {
        _.merge(opts, { cluster_id: cluster.id });
        return factory.buildSync('node', opts).save();
      }).then(() => {
        return factory.buildSync('node', opts).validate();
      })).to.eventually.exist;
    });
  });

  describe('#create', () => {
    let node, cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
      return cluster.save().then(() => {
        node = factory.buildSync('node', { cluster_id: cluster.id });
      });
    });

    context('for all nodes', () => {
      beforeEach(() => {
        return node.save();
      });

      it('has a fqdn with its name and cluster_id', () => {
        let shortId = cluster.id.slice(0, 8),
          expected  = `${node.name}-${shortId}.${config.nodeDomain}`;

        expect(node.fqdn).to.equal(expected);
      });

      it('initializes its jwt token', () => {
        expect(node).to.satisfy(has.validJWT);
      });

      it('initialized its state to deploying', () => {
        expect(node.state).to.equal('deploying');
      });

      it('is not a master node by default', () => {
        expect(node.master).to.be.false;
      });

      it('has empty json labels by default', () => {
        expect(node.labels).to.deep.equal({});
      });
    });

    it('initializes deployed_at to null', () => {
      expect(node.deployed_at).to.be.null;
    });

    it('has a command to get the agent', () => {
      expect(node.agent_cmd).to.equal(`${config.agentCmd} ${node.token}`);
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
