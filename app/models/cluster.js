'use strict';

let mixins = require('./concerns'),
  machine = require('../../config/machine');

module.exports = function(sequelize, DataTypes) {
  let Cluster = sequelize.define('Cluster', mixins.extend('state', 'attributes', {
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
  }, DataTypes), mixins.extend('state', 'options', {
    defaultScope: {
      order: [['id', 'ASC']]
    },
    getterMethods: {
      state_message: function() {
        let state = this.get('state');

        switch (state) {
          case 'empty':
            return 'Create at least one node to work with this cluster';
          case 'unreachable':
            return 'Master node is unreachable';
          case 'deploying':
            return 'One or more node(s) are beeing deployed';
          case 'upgrading':
            return 'One or more node(s) are beeing upgraded';
          case 'running':
            return 'Cluster is running and reachable';
        }
      },
    },
    hooks: {
      beforeCreate: function(cluster) {
        return cluster._initializeToken();
      },
    },
    instanceMethods: {
      _initializeToken: function() {
        return machine.createToken().then(token => {
          this.token = token;
        });
      },
      notify: function(changes) {
        console.log(changes);
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
  }));
  return Cluster;
};
