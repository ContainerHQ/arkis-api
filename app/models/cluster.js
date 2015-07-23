'use strict';

let _ = require('lodash'),
  errors = require('../routes/shared/errors'),
  mixins = require('./concerns'),
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
      unique: true,
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
      afterCreate: function(cluster) {
        return cluster._initializeCert();
      },
      afterDestroy: function(cluster) {
        return cluster._destroyToken();
      },
    },
    instanceMethods: {
      _initializeToken: function() {
        return machine.createToken().then(token => {
          this.token = token;
        });
      },
      _initializeCert: function() {
        return machine.createCerts().then(certs => {
          let params = {};

          _.keys(certs).forEach(type => {
            _.keys(certs[type]).forEach(name => {
              params[`${type}_${name}`] = certs[type][name];
            });
          });
          return this.createCert(params);
        });
      },
      _destroyToken: function() {
        return machine.deleteToken(this.token);
      },
      notify: function(changes) {
        console.log(changes);
      },
      upgrade: function() {
        let state = this.get('state');

        if (state !== 'running') {
          return Promise.reject(new errors.StateError('upgrade', state));
        }
        let versions = {}; //_.first(config.versions);

        return this.getNodes().then(nodes => {
          let promises = _.invoke(nodes, 'upgrade', versions);

          return Promise.all(promises);
        }).then(() => {
          return this.update({
      //      docker_version: versions.docker,
      //      swarm_version: verions.swarm,
            last_state: 'upgrading'
          });
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Cluster.hasMany(models.Node, { onDelete: 'cascade',
          counterCache: { as: 'nodes_count' }
        });
        Cluster.hasOne(models.Cert, { onDelete: 'cascade' });
      }
    }
  }));
  return Cluster;
};
