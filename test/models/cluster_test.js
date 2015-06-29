'use strict';

let moment = require('moment'),
  models = require('../../app/models');

const DEFAULT_STRATEGY = 'spread',
      VALID_STRATEGIES = [DEFAULT_STRATEGY, 'binpack', 'random'],
      DEFAULT_STATE = 'empty',
      VALID_STATES = [DEFAULT_STATE, 'deploying', 'upgrading', 'running'];

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

    VALID_STATES.forEach(state => {
      it(`succeeds with a ${state} last state`, () => {
        let cluster = factory.buildSync('cluster', { last_state: state });

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

  it('has a default state', () => {
    let cluster = factory.buildSync('cluster');

    return expect(cluster.save())
      .to.eventually.have.property('state', DEFAULT_STATE);
  });

  context('afterDestroy', () => {
    let cluster, nodesId;

    beforeEach(done => {
      factory.create('cluster', (err, clusterCreated) => {
        cluster = clusterCreated;

        factory.createMany('node', { cluster_id: cluster.id }, 10, (err, nodes) => {
          nodesId = _.pluck(nodes, 'id');
          done(err);
        });
      });

    });

    it('removes its nodes', () => {
      return expect(
        cluster.destroy().then(() => {
          return models.Node.findAll({ where: { id: nodesId } });
        })
      ).to.be.fulfilled.and.to.eventually.be.empty;
    });
  });

  context('afterCreate', () => {
    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster');
      return cluster.save();
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
      ).to.be.fulfilled.and.to.eventually.be.null;
    });

    context('adding a node to this cluster', () => {
      let previousNodesCount;

      beforeEach(() => {
        previousNodesCount = cluster.nodes_count;

        return models.Node.create({ cluster_id: cluster.id })
        .then(() => {
          return cluster.reload();
        });
      });

      it('increases the node counter', () => {
        expect(cluster.nodes_count).to.equal(previousNodesCount + 1);
      });
    });
  });

  context('when last ping is close enough', () => {
    let cluster;

    beforeEach(() => {
      cluster = factory.buildSync('cluster', { last_state:'upgrading',
        last_ping: moment()
      });
      return cluster.save();
    });

    it('has a state equals to its last state', () => {
      expect(cluster.state).to.equal(cluster.last_state);
    });
  });

  context('when last ping has expired', () => {
    let cluster;

     beforeEach(() => {
      cluster = factory.buildSync('cluster', { last_state: 'deploying',
        last_ping: moment().subtract(6, 'minutes')
      });
      return cluster.save();
    });


    it('is unreachable', () => {
      expect(cluster.state).to.equal('unreachable');
    });
  });
});
