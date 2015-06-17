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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'idle',
    }
  });
};
