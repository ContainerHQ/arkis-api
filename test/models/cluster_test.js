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

    context('adding a node to this cluster', () => {
      let nodesCount;

      beforeEach(() => {
        nodesCount = cluster.nodes_count;

        return models.Node.create({ cluster_id: cluster.id })
        .then(() => {
          return cluster.reload();
        });
      });

      it('increases the node counter', () => {
        expect(cluster.nodes_count).to.equal(nodesCount + 1);
      });
    });
  });

  context.skip('when cluster is idle', () => {
    it('can be deleted', () => {
      return expect(
        cluster.destroy()
        .then(() => {
          return models.Cluster.findById(cluster.id);
        })
      ).to.be.fulfilled.and.to.eventually.to.be.null;;
    });
  });

  context.skip('when cluster is upgrading', () => {
    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('upgradingCluster');
      return cluster.save();
    });

    it("can't be deleted", () => {
      return expect(
        cluster.destroy()
        .then(() => {
          return models.Cluster.findById(cluster.id);
        })
      ).to.be.fulfilled.and.to.eventually.to.be.not.null;;
    });
  });
});
