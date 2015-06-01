'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    queryInterface.createTable('Users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      password: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.dropTable('Users');
  }
};
