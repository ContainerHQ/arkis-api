'use strict';

let _ = require('lodash'),
  errors = require('../routes/shared/errors'),
  mixins = require('./concerns'),
  machine = require('../../config/machine'),
  versions = require('../../config/versions');

const LATEST_VERSIONS = _.first(versions);

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
    containers_count: DataTypes.VIRTUAL
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
          case 'running':
            return 'Cluster is running and reachable';
        }
      },
    },
    hooks: {
      beforeCreate: function(cluster) {
        _.merge(cluster, {
          docker_version: LATEST_VERSIONS.docker,
          swarm_version:  LATEST_VERSIONS.swarm
        });
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
      _hasLatestVersions: function() {
        return LATEST_VERSIONS.docker === this.docker_version &&
               LATEST_VERSIONS.swarm  === this.swarm_version;
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
      notify: function(changes={}) {
        if (_.has(changes, 'last_ping')) {
          return this.update({ last_ping: changes.last_ping });
        }
        switch (changes.last_state) {
          case 'deploying':
          case 'upgrading':
            return this.update({ last_state: changes.last_state });
          case 'destroyed':
          case 'running':
            return this._getLastStateFromNodes().then(lastState => {
              let opts = { last_state: lastState };

              if (changes.master && changes.last_state === 'destroyed') {
                _.merge(opts, { last_ping: null });
              }
              return this.update(opts);
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
          _.invoke(nodes, 'upgrade', versions);

          return this.update({
            docker_version: LATEST_VERSIONS.docker,
            swarm_version:  LATEST_VERSIONS.swarm,
            last_state: 'upgrading'
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
        Cluster.hasOne(models.Cert, { onDelete: 'cascade', hooks: true });
      }
    }
  }));
  return Cluster;
};
