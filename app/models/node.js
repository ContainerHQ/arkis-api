'use strict';

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
    }
  });
};
