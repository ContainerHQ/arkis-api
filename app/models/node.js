'use strict';

let _ = require('lodash'),
  path = require('path'),
  config = require('../../config'),
  fqdn = require('../support').fqdn,
  token = require('../support').token,
  is = require('./validators'),
  mixins = require('./concerns');

module.exports = function(sequelize, DataTypes) {
  let Node = sequelize.define('Node', mixins.extend('state', 'attributes', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    /*
     * The name is used to creates the fqdn, therefore it should only
     * include a-z, 0-9 and hypens and must not start/end with a hypen.
     *
     * There is also an indexe on the database to prevent having a node
     * with the same name and the same cluster.
     */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      validate: _.merge(
        is.subdomainable,
        is.unique({ attribute: 'name', scope: 'cluster' })
      )
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    master: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: is.unique({ attribute: 'master', scope: 'cluster' })
    },
    byon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        followOrigin: function(byon) {
          if (byon && (this.region || this.node_size)) {
            throw new Error("A byon node canno't have a region and size!");
          }
          if (!byon && !(this.region && this.node_size)) {
            throw new Error("A provided node must have a region and size!");
          }
        }
      }
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    node_size: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    public_ip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      unique: true,
      validate: { isIP: true }
    },
    machine_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      unique: true
    },
    cpu: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: null,
      allowNull: true,
      validate: { min: 1 }
    },
    memory: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: null,
      allowNull: true,
      validate: { min: 128 }
    },
    disk: {
      type: DataTypes.REAL.UNSIGNED,
      defaultValue: null,
      allowNull: true,
      validate: { min: 1.0 }
    },
    labels: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isKeyValue: function(labels) {
          if (!_.isPlainObject(labels)) {
            throw new Error('Labels must only contain key/value pairs!');
          }
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
  }, DataTypes, { default: 'deploying' }), mixins.extend('state', 'options', {
    defaultScope: {
      order: [['id', 'ASC']]
    },
    scopes: {
      cluster: function(id) {
        return { where: { cluster_id: id } };
      },
      filtered: function(filters) {
        let criterias = _.pick(filters, [
          'byon', 'master', 'name', 'region', 'node_size', 'labels'
        ]);
        return { where: criterias };
      },
      nonRunningNorUnreachable: {
        where: { last_state: { $ne: 'running' } }
      },
      runningIPs: {
        attributes: ['public_ip'],
        where: { public_ip: { $ne: null }, last_state: 'running' }
      },
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
            return 'Node is being deployed';
          case 'upgrading':
            return 'Node is being upgraded';
          case 'updating':
            return 'Node is being updated';
          case 'running':
            return 'Node is running and reachable';
        }
      },
      agent_cmd: function() {
        return `${config.agentCmd} ${this.get('token')}`;
      },
      fqdn: function() {
        let clusterId = this.get('cluster_id');

        if (!clusterId) { return null; }

        let clusterShortId = clusterId.slice(0, 8);

        return `${this.get('name')}-${clusterShortId}.${config.nodeDomain}`;
      }
    },
    hooks: {
      beforeCreate: function(node) {
        node.token = token.generate(node.id);
      },
      beforeUpdate: function(node, options) {
        if (
          _.includes(options.fields, 'name') ||
          _.includes(options.fields, 'public_ip')
        ) {
          return fqdn.register(node);
        }
        return Promise.resolve(node);
      },
      beforeDestroy: function(node) {
        return fqdn.unregister(node.fqdn);
      },
    },
    instanceMethods: {
      serialize: function({ baseUrl }) {
        let actionsPath = path.join(baseUrl, this.id, 'actions');

        return _(this.toJSON())
        .omit(['token', 'machine_id', 'last_state'])
        .merge(this.byon ? { agent_cmd: null } : {})
        .merge({ links: { actions: actionsPath } })
        .value();
      }
    },
    classMethods: {
      associate: function(models) {
        Node.belongsTo(models.Cluster);
        Node.hasMany(models.Action, {
          foreignKey: 'resource_id',
          constraints: false,
          scope: { resource: 'node' }
        });
      }
    }
  }));
  return Node;
};
