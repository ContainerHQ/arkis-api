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
          'byon', 'master', 'name', 'region', 'node_size'
        ]);
        return { where: criterias };
      },
      nonRunning: { where: { last_state: { $ne: 'running' } } }
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

        return machine.agentCmd(this.get('token'));
      }
    },
    instanceMethods: {
      _generateToken: function() {
        this.token = token.generate(this.id);
      },
      _hasVersions: function(versions) {
        return versions.docker === this.docker_version &&
               versions.swarm  === this.swarm_version;
      },
      _notifyCluster: function(changes) {
        return this.getCluster().then(cluster => {
          /*
           * This ensures that the node won't notify its cluster if it has
           * been deleted (when the cluster is deleted, it deletes its nodes
           * in cascade).
           */
          if (cluster) {
            return cluster.notify(changes);
          }
          return Promise.resolve();
        });
      },
      /*
       * Changes commits to the machine some changes and update the node
       * accordingly and also ensures to put the node in updating state, until
       * the node agent registers that it has finished to process the changes.
       *
       * This method is agnostic from changes nature. It's up to the caller
       * to filter the changes that must be processed.
       */
      change: function(changes={}) {
        if (this.state !== 'running') {
          return Promise.reject(new errors.StateError('update', this.state));
        }
        if (_.isEmpty(changes)) { return Promise.resolve(this); }

        _.merge(this, { last_state: 'updating' }, changes);

        return this.validate().then(() => {
          return machine.update(changes);
        }).then(() => {
          return this.save();
        });
      },
      /*
       * This must update the node in order to notify its
       * affiliated cluster of its new state.
       */
      register: function(infos={}) {
        let opts = { last_state: 'running', last_ping: Date.now() };

        return this.update(_.merge(opts, infos));
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
      agentInfos: function() {
        return this.getCluster().then(cluster => {
          return {
            master: this.master,
            name:   this.name,
            cert: cluster.cert,
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
        node._generateToken();
        node.fqdn = machine.generateFQDN({});

        if (!node.byon) {
          return machine.create({});
        }
        return Promise.resolve(node);
      },
      afterCreate: function(node) {
        return node._notifyCluster({ last_state: node.last_state });
      },
      beforeUpdate: function(node, options) {
        if (_.includes(options.fields, 'public_ip')) {
          return machine.registerFQDN(node);
        }
        return Promise.resolve(node);
      },
      /*
       * If a field is set to its prior value, it won't appears in
       * options.field.
       */
      afterUpdate: function(node, options) {
        /*
         * If a master node updated its ping or a node is promoted to master,
         * we must notify the cluster to update its last ping.
         */
        if ((_.includes(options.fields, 'last_ping') ||
             _.includes(options.fields, 'master')) && node.master) {
          return node._notifyCluster({ last_ping: node.last_ping });
        }
        if (_.includes(options.fields, 'master') && !node.master) {
          return node._notifyCluster({ last_ping: null });
        }
        if (_.includes(options.fields, 'last_state')) {
          return node._notifyCluster({ last_state: node.last_state });
        }
        return Promise.resolve(node);
      },
      beforeDestroy: function(node) {
        let promise = Promise.resolve(node);

        if (!node.byon) { promise = machine.destroy({}); }

        return promise.then(() => {
          return machine.deleteFQDN(node.fqdn);
        });
      },
      afterDestroy: function(node) {
        return node._notifyCluster({
          last_state: 'destroyed',
          master: node.master
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
