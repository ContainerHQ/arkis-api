'use strict';

let _ = require('lodash'),
  config = require('../../config'),
  concerns = require('./concerns'),
  fqdn = require('../support').fqdn,
  token = require('../support').token,
  is = require('./validators');

const CONCERNS = {
  serializable: {
    omit:  ['token', 'machine_id', 'last_state'],
    links: ['actions'],
    specifics: { byon: { merge: { agent_cmd: null } } }
  },
  state: { defaultState: 'deploying' }
};

module.exports = function(sequelize, DataTypes) {
  let { attributes, options } = concerns.extend({
    attributes: {
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
        validate: _.merge({ len: [1, 64] },
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
            if (byon && (this.region || this.size)) {
              throw new Error("A byon node canno't have a region and size.");
            }
            if (!byon && !(this.region && this.size)) {
              throw new Error("A provided node must have a region and size.");
            }
          }
        }
      },
      region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      public_ip: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: true,
        validate: _.merge({ isIP: true },
          is.unique({ attribute: 'public_ip' })
        )
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
          isPlainObject: function(labels) {
            if (!_.isPlainObject(labels)) {
              throw new Error('Labels must be a json object.');
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
      deployed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    options: {
      defaultScope: {
        order: [['id', 'ASC']]
      },
      scopes: {
        cluster: function(id) {
          return { where: { cluster_id: id } };
        },
        filtered: function(filters) {
          let criterias = _.pick(filters, [
            'byon', 'master', 'name', 'region', 'size', 'labels'
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
          return `${config.agent.cmd} ${this.get('token')}`;
        },
        fqdn: function() {
          let clusterId = this.get('cluster_id');

          if (!clusterId) { return null; }

          let name = this.get('name'),
            clusterShortId = clusterId.slice(0, 8);

          return `${name}-${clusterShortId}.node.${config.domain}`;
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
      classMethods: {
        associate: function(models) {
          this.belongsTo(models.Cluster);
          this.hasMany(models.Action, {
            foreignKey: 'resource_id',
            constraints: false,
            scope: { resource: 'node' }
          });
        }
      }
    }
  }, CONCERNS, { DataTypes: DataTypes });

  return sequelize.define('Node', attributes, options);
};
