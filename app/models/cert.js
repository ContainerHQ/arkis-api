'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Cert', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    server_cert: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    },
    server_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    },
    server_ca: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    },
    client_cert: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    },
    client_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    },
    client_ca: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null
    }
  });
};
