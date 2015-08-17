'use strict';

let _ = require('lodash'),
  moment = require('moment'),
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
      validate: is.subdomainable
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
      validate: {
        isUnique: function(master) {
          if (!master || !this.cluster_id) { return Promise.resolve(); }

          return Node.findOne({ where:  {
            cluster_id: this.cluster_id,
            master: true
          }}).then(node => {
            if (node) {
              return Promise.reject('This cluster already has a master node!');
            }
          });
        }
      }
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
          if (!byon && (!this.region || !this.node_size)) {
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
        if (!this.get('byon')) { return null; }

        return `${config.agentCmd} ${this.get('token')}`;
      },
      fqdn: function() {
        let clusterId = this.get('cluster_id');

        if (!clusterId) { return null; }

        let clusterShortId = clusterId.slice(0, 8);

        return `${this.get('name')}-${clusterShortId}.${config.nodeDomain}`;
      }
    },
    instanceMethods: {
      /*
       * Registers new informations of a node and ensures to put the node
       * in running state. Must be called whenever an agent has finished
       * its pending work.
       */
      register: function(infos={}) {
        let opts = { last_state: 'running', last_ping: Date.now() };

        return this.update(_.merge(opts, infos));
      },
      /*
       * Updates the last_ping of a node to current date and time.
       */
      ping: function() {
        return this.update({ last_ping: moment() });
      },
      /*
       * Informations required by the agent to provision the node.
       */
      agentInfos: function() {
        return this.getCluster().then(cluster => {
          return {
            master: this.master,
            name:   this.name,
            labels: this.labels,
            cert: {
              ca:   cluster.cert.server_ca,
              cert: cluster.cert.server_cert,
              key:  cluster.cert.server_key,
            },
            versions: {
              docker:   cluster.docker_version,
              swarm:    cluster.swarm_version
            },
            strategy: cluster.strategy
          };
        });
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
        Node.belongsTo(models.Cluster);
      }
    }
  }));
  return Node;
};
