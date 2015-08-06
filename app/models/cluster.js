'use strict';

let _ = require('lodash'),
  errors = require('../routes/shared/errors'),
  mixins = require('./concerns'),
  machine = require('../../config/machine'),
  config = require('../../config');

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
        /*
         * We first try to create the ssl certificates, to avoid an
         * unnecessary call to the docker hub discovery service.ss
         */
        return cluster._initializeCert().then(() => {
          return cluster._initializeToken();
        });
      },
      beforeDestroy: function(cluster) {
        return machine.deleteToken(cluster.token);
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
          this.cert = {};

          _.keys(certs).forEach(type => {
            _.keys(certs[type]).forEach(name => {
              this.cert[`${type}_${name}`] = certs[type][name];
            });
          });
          return this;
        });
      },
      _hasLatestVersions: function() {
        return config.latestVersions.docker === this.docker_version &&
               config.latestVersions.swarm  === this.swarm_version;
      },
      _getLastStateFromNodes: function() {
        if (this.nodes_count <= 0) {
          return Promise.resolve('empty');
        }
        return this.getNodes({ scope: 'nonRunning' }).then(nodes => {
          if (_.isEmpty(nodes)) {
            return 'running';
          }
          return _.first(nodes).last_state;
        });
      },
      _removeLastPing: function() {
        this.last_ping = null;
      },
      /*
       * If the cluster already has updated its attributes with the same
       * changes, sequelize won't try to update them again.
       */
      notify: function(changes={}) {
        if (_.has(changes, 'last_ping')) {
          return this.update({ last_ping: changes.last_ping });
        }
        switch (changes.last_state) {
          case 'deploying':
          case 'upgrading':
          case 'updating':
            return this.update({ last_state: changes.last_state });
          case 'destroyed':
          case 'running':
            return this._getLastStateFromNodes().then(lastState => {
              if (changes.master && changes.last_state === 'destroyed') {
                this._removeLastPing();
              }
              return this.update({ last_state: lastState });
            });
        }
        return Promise.resolve(this);
      },
      upgrade: function() {
        let state = this.get('state');

        if (state !== 'running') {
          return Promise.reject(new errors.StateError('upgrade', state));
        }
        if (this._hasLatestVersions()) {
          return Promise.reject(new errors.AlreadyUpgradedError());
        }
        return this.getNodes().then(nodes => {
          _.invoke(nodes, 'upgrade', config.latestVersions);
          /*
           * When a node is updated, the cluster is notified and update its
           * state accordingly, beside, when every node upgrade call fails,
           * the cluster state must not changed to. Therefore we don't need
           * to update the state here. However, versions must be updated,
           * the node agent will automatically get these informations when
           * the node will be restarted.
           */
          return this.update({
            docker_version: config.latestVersions.docker,
            swarm_version:  config.latestVersions.swarm,
          });
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Cluster.hasMany(models.Node, {
          onDelete: 'cascade',
          hooks: true,
          counterCache: { as: 'nodes_count' },
        });
      }
    }
  }));
  return Cluster;
};
