'use strict';

let _ = require('lodash'),
  moment = require('moment'),
  errors = require('../routes/shared/errors'),
  machine = require('../../config/machine'),
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
    master: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    fqdn: {
      type: DataTypes.STRING,
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
    containers_count: DataTypes.VIRTUAL
  }, DataTypes), mixins.extend('state', 'options', {
    instanceMethods: {
      deploy: function() {
        return machine.create({}).then(() => {
          return this.update({ last_state: 'deploying' });
        });
      },
      register: function() {
        return machine.registerFQDN(this.public_ip).then(fqdn => {
          return this.update({ fqdn: fqdn, last_state: 'running' });
        });
      },
      upgrade: function() {
        let state = this.get('state');

        if (state !== 'running') {
          return new Promise((resolve, reject) => {
            reject(new errors.StateError('upgrade', state));
          });
        }
        return machine.upgrade({}).then(() => {
          return this.update({ last_state: 'upgrading' });
        });
      },
      ping: function() {
        return this.update({ last_ping: moment() });
      },
      _notifyCluster: function(changes) {
        return this.getCluster().then(cluster => {
          return cluster.notify(changes);
        });
      }
    },
    hooks: {
      afterUpdate: function(node, options) {
        if (node.master && _.includes(options.fields, 'last_ping')) {
          return node._notifyCluster({ last_ping: node.last_ping });
        }
        if (_.includes(options.fields, 'last_state')) {
          return node._notifyCluster({ last_state: node.last_state });
        }
        return sequelize.Promise.resolve(node);
      },
      afterDestroy: function(node) {
        return machine.destroy({}).then(() => {
          return node._notifyCluster({ destroyed: true });
        });
      },
      afterFind: function(nodes) {
        if (!nodes) { return sequelize.Promise.resolve(); }

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
