'use strict';

let models = require('../../app/models');

const DEFAULT_STRATEGY = 'spread',
      VALID_STRATEGIES = [DEFAULT_STRATEGY, 'binpack', 'random'];

describe('Cluster Model', () => {
  db.sync();

  describe('validations', () => {
    it('succeeds with valid attributes', () => {
      let cluster = factory.buildSync('cluster');

      return expect(cluster.save()).to.be.fulfilled;
    });

    it('succeeds with a min size name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 1) });

      return expect(cluster.save()).to.be.fulfilled;
    });

    it('succeeds with a max size name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 64) });

      return expect(cluster.save()).to.be.fulfilled;
    });

    VALID_STRATEGIES.forEach(strategy => {
      it(`succeeds with a ${strategy} strategy`, () => {
        let cluster = factory.buildSync('cluster', { strategy: strategy });

        return expect(cluster.save()).to.be.fulfilled;
      });
    });

    it('fails without a name', () => {
      let cluster = factory.buildSync('cluster', { name: null });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with an empty name', () => {
      let cluster = factory.buildSync('cluster', { name: '' });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with a too long name', () => {
      let cluster = factory.buildSync('cluster', { name: _.repeat('*', 65) });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with an empty strategy', () => {
      let cluster = factory.buildSync('cluster', { strategy: '' });

      return expect(cluster.save()).to.be.rejected;
    });

    it('fails with a null strategy', () => {
      let cluster = factory.buildSync('cluster', { strategy: null });

      return expect(cluster.save()).to.be.rejected;
    })

    it('fails with an invalid strategy', () => {
      let cluster = factory.buildSync('cluster', { strategy: 'whatever' });

      return expect(cluster.save()).to.be.rejected;
    });;
  });

  it('has a default strategy', () => {
    let cluster = factory.buildSync('cluster');

    return expect(cluster.save())
      .to.eventually.have.property('strategy', DEFAULT_STRATEGY);
  });


  // Add tests for state
  context('afterCreate', () => {
    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
      return cluster.save();
    });

    it('is in idle state', () => {
      expect(cluster.state).to.equal('idle');
    });

    it('has a token', () => {
      expect(cluster.token).to.exist;
    });

    it('can be deleted', () => {
      return expect(
        cluster.destroy()
        .then(() => {
          return models.Cluster.findById(cluster.id);
        })
      ).to.be.fulfilled.and.to.eventually.to.be.null;
    });

    context('adding a node to this cluster', () => {
      let nodesCount;

      beforeEach(() => {
        nodesCount = cluster.nodes_count;

        // Use factory !
        return models.Node.create({ cluster_id: cluster.id })
        .then(() => {
          return cluster.reload();
        });
      });

      it('increases the node counter', () => {
        expect(cluster.nodes_count).to.equal(nodesCount + 1);
      });
    });

    it('is in idle state', () => {
      expect(cluster.state).to.equal('idle');
    });

    context('whith many running nodes', () => {
      beforeEach(done => {
        factory.createMany('node', { state: 'running', cluster_id: cluster.id }, 10, () => {
          cluster.reload().then(() => { done(); }).catch(done);
        });
      });

      it('is in runnning state', () => {
        expect(cluster.state).to.equal('running');
      });

      context('whith at list one node still deploying', () => {
        beforeEach(done => {
          factory.create('node', { state: 'deploying', cluster_id: cluster.id }, () => {
            cluster.reload().then(() => { done(); }).catch(done);
          });
        });

        it('is in deploying state', () => {
          expect(cluster.state).to.equal('deploying');
        });

        it("can't be deleted", () => {
          return expect(
            cluster.destroy()
            .then(() => {
              return models.Cluster.findById(cluster.id);
            })
          ).to.be.rejected;
        });
      });
    });
  });
});
