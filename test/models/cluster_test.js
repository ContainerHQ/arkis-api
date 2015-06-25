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

  context('afterDestroy', () => {
    let cluster, nodes;

    beforeEach(done => {
      factory.create('cluster', (err, clusterCreated) => {
        cluster = clusterCreated;

        factory.createMany('node', { cluster_id: cluster.id }, 10, (err, nodesCreated) => {
          nodes = nodesCreated;
          done(err);
        });
      });

    });

    it('removes its nodes', () => {
      let nodesId = _.pluck(nodes, 'id');

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

    context('with only slave nodes', () => {
      beforeEach(done => {
        factory.createMany('node', { cluster_id: cluster.id }, 10, done);
      });

      it('is unreachable', () => {
        return expect(cluster.reload())
          .to.eventually.have.property('state', 'unreachable');
      });

      it('has no containers count', () => {
        return expect(cluster.reload())
          .to.eventually.have.property('containers_count', 0);
      });
    })

    context('whith many running nodes', () => {
      beforeEach(done => {
        let opts = { state: 'running', cluster_id: cluster.id };

        factory.createMany('node', opts, 10, done);
      });

      ['deploying', 'upgrading', 'starting', 'stopping', 'down'].forEach(state => {
        context(`with a master node still ${state}`, () => {
          beforeEach(done => {
            let opts = { state: state, cluster_id: cluster.id };

            factory.create('masterNode', opts, done);
          });

          it('is unreachable', () => {
            return expect(cluster.reload())
              .to.eventually.have.property('state', 'unreachable');
          });
        });
      });

      context('with a running master node', () => {
        let master;

        beforeEach(done => {
          let opts = { state: 'running', cluster_id: cluster.id };

          factory.create('masterNode', opts, (err, nodeCreated) => {
            master = nodeCreated;
            done(err);
          });
        });

        it('is in runnning state', () => {
          return expect(cluster.reload())
            .to.eventually.have.property('state', 'running');
        });

        it('has a container count equal to its master containers count', () => {
          return expect(cluster.reload())
            .to.eventually.have.property('containers_count', master.containers_count);
        });

        ['deploying', 'upgrading'].forEach(state => {
          context(`with a node still ${state}`, () => {
            beforeEach(done => {
              let opts = { state: state, cluster_id: cluster.id };

              factory.create('node', opts, done);
            });

            it(`is in ${state} state`, () => {
              return expect(cluster.reload())
                .to.eventually.have.property('state', state);
            });
          });
        });

        ['starting', 'stopping', 'down'].forEach(state => {
          context(`with a node ${state}`, () => {
            beforeEach(done => {
              let opts = { state: state, cluster_id: cluster.id };

              factory.create('node', opts, done);
            });

            it(`is in partially_running state`, () => {
              return expect(cluster.reload())
                .to.eventually.have.property('state', 'partially_running');
            });
          });
        });
      });
    });
  });
});
