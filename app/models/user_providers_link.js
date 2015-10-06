'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserProviderLink', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null,
      validate: {
        isIn: [['ssh_key']]
      }
    },
    provider_id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: null
    }
  }, {
    classMethods: {
      associate: function(models) {
        this.belongsTo(models.User);
      }
    }
  });
};
