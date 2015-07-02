'use strict';

let _ = require('lodash'),
  mixins = require('./concerns');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Node', mixins.extend('state', 'attributes', {
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
    hooks: {
      afterFind: function(nodes) {
        if (!nodes) { return sequelize.Promise.resolve(); }

        if (!_.isArray(nodes)) {
          nodes = [nodes];
        }
        nodes.forEach(node => {
          node.containers_count = 2;
        });
        // update state (ping the machine)
      }
    }
  }));
};
