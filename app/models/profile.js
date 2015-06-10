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
      validate: { len: [0, 128] }
    }
  // This must be compatible with github validations
  // > size
  //
  // Autocomplete profile
  });
};
