'use strict';

let _ = require('lodash'),
  mixins = require('./concerns'),
  config = require('../../config'),
  cert = require('../support').cert,
  is = require('./validators');

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
      validate: is.subdomainable
    },
    cert: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
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
    docker_version: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    swarm_version: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  }, DataTypes), mixins.extend('state', 'options', {
    defaultScope: { order: [['id', 'ASC']] },
    scopes: {
      user: function(id) {
        return { where: { user_id: id } };
      },
      filtered: function(filters) {
        let criterias = _.pick(filters, ['name', 'strategy']);

        return { where: criterias };
      }
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
          case 'updating':
            return 'One or more node(s) are beeing updated';
          case 'running':
            return 'Cluster is running and reachable';
        }
      },
    },
    hooks: {
      beforeCreate: function(cluster) {
        _.merge(cluster, {
          docker_version: config.latestVersions.docker,
          swarm_version:  config.latestVersions.swarm
        });
        return cert.generate().then(cert => {
          cluster.cert = cert;
          return cluster;
        });
      }
    },
    instanceMethods: {
      retrieveState: function() {
        if (this.nodes_count <= 0) { return Promise.resolve('empty'); }

        return this.getNodes({ scope: 'nonRunningNorUnreachable' })
        .then(nodes => {
          return _.isEmpty(nodes) ? 'running' : _.first(nodes).last_state;
        });
      },
      /*
       * If the cluster already has updated its attributes with the same
       * changes, sequelize won't try to update them again.
       */
      notify: function(changes={}) {
        changes = _.pick(changes, ['last_state', 'last_ping']);

        switch (changes.last_state) {
          case 'destroyed':
          case 'running':
            return this.retrieveState().then(state => {
              changes.last_state = state;
              return this.update(changes);
            });
        }
        return this.update(changes);
      }
    },
    classMethods: {
      associate: function(models) {
        Cluster.hasMany(models.Node, { onDelete: 'cascade', hooks: true,
          counterCache: { as: 'nodes_count' }
        });
      }
    }
  }));
  return Cluster;
};
