'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { len: [0, 64] }
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { len: [0, 64] }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { len: [0, 64] }
    }
  });
};
