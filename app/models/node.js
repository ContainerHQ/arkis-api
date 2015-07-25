'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../routes/shared/errors'),
  machine = require('../../config/machine'),
  token = require('../../config/token'),
  mixins = require('./concerns');

module.exports = function(sequelize, DataTypes) {
  let Node = sequelize.define('Node', mixins.extend('state', 'attributes', {
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
    master: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      validate: {
        isUnique: function(master) {
          if (!master || !this.cluster_id) { return Promise.resolve(); }

          return this.findOne({ where:  { cluster_id: this.cluster_id,
            master: true
          }}).then(node => {
            if (node) {
              return Promise.reject('Cluster already has a master node!');
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
    fqdn: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      defaultValue: null,
      validate: { isUrl: true }
    },
    public_ip: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { isIP: true }
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
  }, DataTypes, { default: 'deploying' }), mixins.extend('state', 'options', {
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
          case 'running':
            return 'Node is running and reachable';
        }
      },
    },
    instanceMethods: {
      _generateToken: function() {
        this.token = token.generate(this.id);
      },
      _hasVersions: function(versions) {
        return versions.docker === this.docker_version &&
               versions.swarm  === this.swarm_version;
      },
      /*
       * This must update the node in order to notify its
       * affiliated cluster of its new state.
       */
      register: function(attributes={}) {
        _.merge(attributes, { last_state: 'running' });
        return this.update(attributes);
      },
      upgrade: function(versions) {
        let state = this.get('state');

        if (state !== 'running') {
          return Promise.reject(new errors.StateError('upgrade', state));
        }
        if (this._hasVersions(versions)) {
          return Promise.reject(new errors.AlreadyUpgradedError());
        }
        return machine.upgrade(versions).then(() => {
          return this.update({ last_state: 'upgrading' });
        });
      },
      ping: function() {
        return this.update({ last_ping: moment() });
      },
      _notifyCluster: function(changes) {
        return this.getCluster().then(cluster => {
          if (!cluster) {
            return Promise.resolve();
          }
          return cluster.notify(changes);
        });
      }
    },
    hooks: {
      beforeCreate: function(node) {
        node._generateToken();
        node.fqdn = machine.generateFQDN({});

        if (!node.byon) {
          return machine.create({});
        }
        return Promise.resolve(node);
      },
      afterUpdate: function(node, options) {
        if (_.includes(options.fields, 'public_ip')) {
          return machine.registerFQDN(node);
        }
        if (node.master && _.includes(options.fields, 'last_ping')) {
          return node._notifyCluster({ last_ping: node.last_ping });
        }
        if (_.includes(options.fields, 'last_state')) {
          return node._notifyCluster({ last_state: node.last_state });
        }
        return sequelize.Promise.resolve(node);
      },
      afterDestroy: function(node) {
        let promise = Promise.resolve();

        if (!node.byon) { promise = machine.destroy({}); }

        return machine.deleteFQDN(node.fqdn).then(() => {
          return promise;
        }).then(() => {
          return node._notifyCluster({ destroyed: true });
        });
      },
      afterFind: function(nodes) {
        if (!nodes) { return Promise.resolve(); }

        if (!_.isArray(nodes)) {
          nodes = [nodes];
        }
        nodes.forEach(node => {
          node.containers_count = 2;
        });
      }
    },
    classMethods: {
      associate: function(models) {
        Node.belongsTo(models.Cluster);
      }
    }
  }));
  return Node;
};
