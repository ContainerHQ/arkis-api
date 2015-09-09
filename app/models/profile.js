'use strict';

let _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
  }, {
    instanceMethods: {
      serialize: function() {
        return _(this.toJSON()).omit(['user_id']).value();
      }
    }
  });
};
