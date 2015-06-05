'use strict';

module.exports = function(sequelize, DataTypes) {
  let Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: true,
      validate: { len: [6, 128] }
    },
    classMethods: {
      associate: function(models) {
        Profile.belongsTo(models.User);
      }
    }
  });
  return Profile;
};
