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
        allowNull: false,
        defaultValue: null,
        unique: true,
        validate: { isEmail: true }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: { len: [6, 128] }
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      provider_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        unique: 'provider'
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        unique: true
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    });
  },

  down: function (queryInterface, DataTypes) {
    queryInterface.dropTable('Users');
  }
};
