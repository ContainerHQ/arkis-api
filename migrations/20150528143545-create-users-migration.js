'use strict';

module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable('Users', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
        validate: { isEmail: true }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: null,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      provider_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: true
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: null,
        unique: true
      },
      token_id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV1,
        unique: true
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Users');
  }
};
