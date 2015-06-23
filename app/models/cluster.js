'use strict';

let _ = require('lodash'),
  machine = require('../../config/machine');

module.exports = function(sequelize, DataTypes) {
  let Cluster = sequelize.define('Cluster', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      validate: { len: [1, 64] }
    },
    state: DataTypes.VIRTUAL,
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    strategy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'spread',
      validate: {
        isIn: {
          args: [['spread', 'binpack', 'random']],
          msg: 'Must be spread, binpack or random'
        }
      }
    },
    containers_count: DataTypes.VIRTUAL
  }, {
    getterMethods: {
      state_message: function() {
        //switch this.state
        return 'Create at least one node to work with this cluster';
      },
    },
    hooks: {
      beforeCreate: function(cluster) {
        return cluster.initializeToken();
      },
      afterCreate: function(cluster) {
        return cluster.updateState();
      },
      afterFind: function(clusters) {
        if (!clusters) { return sequelize.Promise.resolve(); }

        /*
         * afterFind receives either a single object or an array of object.
         *
         * In case of a single object and to avoid code duplication, this
         * single object is map into an array.
         */
        if (!_.isArray(clusters)) {
          clusters = [clusters];
        }

        let promises = [];

        clusters.forEach(cluster => {
          promises.push(cluster.updateState());
        });
        return Promise.all(promises);
      }
    },
    instanceMethods: {
      updateState: function() {
        if (this.nodes_count <= 0) {
          this.state = 'idle';
          return;
        }
        this.containers_count = 0;
        return this.getNodes()
        .then(nodes => {
          let master = _.find(nodes, { master: true }) || {};

          switch (master.state) {
            case 'deploying':
            case 'upgrading':
            case 'starting':
            case 'stopping':
            case 'down':
            case undefined:
              this.state = 'unavailable';
              return;
          }
          let slave = _.find(nodes, node => {
            if (node.state === 'deploying' || node.state === 'upgrading') {
              return node;
            }
          });

          if (slave) {
            this.state = slave.state;
            return;
          }
          slave = _.find(nodes, node => {
            if (node.state === 'starting' || node.state === 'stopping' || node.state === 'down') {
              return node;
            }
          });
          this.state = slave ? 'partially_running' : 'running';
        });
      },
      initializeToken: function() {
        return machine.createToken().then(token => {
          this.token = token;
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Cluster.hasMany(models.Node, {
          onDelete: 'cascade',
          counterCache: { as: 'nodes_count' }
        });
      }
    }
  });
  return Cluster;
};
