'use strict';

let _ = require('lodash'),
  moment = require('moment'),
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
    last_state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'empty',
      validate: { isIn: [['empty', 'deploying', 'upgrading', 'running']] }
    },
    last_ping: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    containers_count: DataTypes.VIRTUAL
  }, {
    defaultScope: {
      order: [['id', 'ASC']]
    },
    getterMethods: {
      state: function() {
        let lastPing = this.getDataValue('last_ping') || moment();

        if (lastPing < moment().subtract(5, 'minutes')) {
          return 'unreachable';
        }
        return this.getDataValue('last_state');
      },
      state_message: function() {
        let state = this.getDataValue('state');

        switch (state) {
          case 'empty':
            return 'Create at least one node to work with this cluster';
          case 'unreachable':
            return 'Master node unreachable';
          case 'Deploying':
            return 'One or more node(s) is deploying';
          case 'Upgrading':
            return 'One or more node(s) is upgrading';
          case 'Running':
            return 'Everything is deployed and running smoothly';
        }
      },
    },
    hooks: {
      beforeCreate: function(cluster) {
        return cluster.initializeToken();
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

        clusters.forEach(() => {
      //    promises.push(cluster.updateState());
        });
        return Promise.all(promises);
      }
    },
    instanceMethods: {
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
