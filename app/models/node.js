'use strict';

let _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Node', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    state: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [
        'deploying', 'upgrading', 'starting', 'running', 'stopping', 'down'
      ],
      defaultValue: 'deploying',
    },
    master: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    containers_count: DataTypes.VIRTUAL
  }, {
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
  });
};
